import { experimental_createEffect, S, type EffectContext } from "envio";
import {
    ipfsMetadataSchema,
    relationshipSchema,
    structureSchema,
    addressSchema,
    propertySchema,
    ipfsFactSheetSchema,
    salesHistorySchema,
    taxSchema,
    type IpfsMetadata,
    type RelationshipData,
    type AddressData,
    type StructureData,
    type PropertyData,
    type IpfsFactSheetData,
    type SalesHistoryData,
    type TaxData
} from "./schemas";

// Convert bytes32 to CID (same as subgraph implementation)
//
export function bytes32ToCID(dataHashHex: string): string {
    // Remove 0x prefix if present
    const cleanHex = dataHashHex.startsWith('0x') ? dataHashHex.slice(2) : dataHashHex;

    // Convert hex string to bytes
    const hashBytes = new Uint8Array(
        cleanHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Create multihash (sha256 + 32 bytes + hash)
    const multihash = new Uint8Array(34);
    multihash[0] = 0x12; // sha256
    multihash[1] = 0x20; // 32 bytes

    for (let i = 0; i < 32; i++) {
        multihash[i + 2] = hashBytes[i];
    }

    // Create CID data (v1 + raw codec + multihash)
    const cidData = new Uint8Array(36);
    cidData[0] = 0x01; // CID v1
    cidData[1] = 0x55; // raw codec

    for (let i = 0; i < 34; i++) {
        cidData[i + 2] = multihash[i];
    }

    // Base32 encode
    const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
    let output = "";
    let bits = 0;
    let value = 0;

    for (let i = 0; i < cidData.length; i++) {
        value = (value << 8) | cidData[i];
        bits += 8;

        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
    }

    return "b" + output;
}

// Build gateway configuration - use single specified gateway only
function buildEndpoints() {
    // Use only the specified gateway with infinite retries
    return [{
        url: "https://maroon-ready-rooster-237.mypinata.cloud/ipfs",
        token: "pE_aFn_OMobMfmayHdoRYV_MRQ_ECYbzI4XGsKNV4x4VkuQiUUeNmFVRbiCwYb73"
    }];
}

// Gateway configuration with optional authentication tokens
const endpoints = buildEndpoints();

// Helper function to build URL with optional token
function buildGatewayUrl(baseUrl: string, cid: string, token: string | null): string {
    const url = `${baseUrl}/${cid}`;
    if (token) {
        return `${url}?pinataGatewayToken=${token}`;
    }
    return url;
}

// Helper function to check if error should trigger retry (connection errors, timeouts, rate limits)
function shouldRetryIndefinitely(response?: Response, error?: Error): boolean {
    // Retry indefinitely on connection/timeout errors
    if (error?.name === 'ConnectTimeoutError' ||
        error?.name === 'TypeError' ||
        error?.name === 'FetchError' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('ENOTFOUND') ||
        error?.message?.includes('ETIMEDOUT') ||
        error?.message?.includes('fetch failed')) {
        return true;
    }

    // Also check the underlying error cause for connection issues
    const cause = (error as any)?.cause;
    if (cause?.name === 'ConnectTimeoutError' ||
        cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        cause?.message?.includes('Connect Timeout Error') ||
        cause?.message?.includes('timeout')) {
        return true;
    }

    // Retry indefinitely on specific HTTP status codes
    if (response) {
        return response.status === 429 || response.status === 500 || response.status === 502 || response.status === 504;
    }

    return false;
}

// Helper function for other non-retriable errors (give up after few attempts)
function shouldRetryLimited(response?: Response, error?: Error): boolean {
    if (response) {
        return response.status >= 500 && response.status !== 500 && response.status !== 502 && response.status !== 504;
    }
    return false;
}

// Helper function to wait with exponential backoff
async function waitWithBackoff(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
}

// New infinite retry function for IPFS data fetching that never gives up on connection errors
async function fetchDataWithInfiniteRetry<T>(
    context: EffectContext,
    cid: string,
    dataType: string,
    validator: (data: any) => boolean,
    transformer: (data: any) => T
): Promise<T> {
    let totalAttempts = 0;
    let notFoundAttempts = 0; // count 404 attempts

    while (true) {
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            totalAttempts++;

            try {
                const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
                const response = await fetch(fullUrl);

                if (response.ok) {
                    const data: any = await response.json();
                    if (validator(data)) {
                        if (totalAttempts > 1) {
                            context.log.info(`${dataType} fetch succeeded after ${totalAttempts} attempts`, {
                                cid,
                                endpoint: endpoint.url,
                                totalAttempts
                            });
                        }
                        return transformer(data);
                    } else {
                        context.log.warn(`${dataType} validation failed`, {
                            cid,
                            endpoint: endpoint.url,
                            attempt: totalAttempts
                        });
                    }
                } else {
                    // Special-case: 404 should retry only 3 times, then error
                    if (response.status === 404) {
                        notFoundAttempts++;
                        if (notFoundAttempts < 3) {
                            context.log.warn(`${dataType} fetch returned 404, will retry`, {
                                cid,
                                endpoint: endpoint.url,
                                status: response.status,
                                statusText: response.statusText,
                                attempt404: notFoundAttempts,
                                maxAttempts404: 3,
                                attempt: totalAttempts
                            });
                            continue;
                        } else {
                            context.log.error(`${dataType} fetch returned 404 after 3 attempts, stopping`, {
                                cid,
                                endpoint: endpoint.url,
                                status: response.status,
                                statusText: response.statusText,
                                attempt404: notFoundAttempts,
                                maxAttempts404: 3,
                                attempt: totalAttempts
                            });
                            throw new Error(`${dataType} fetch failed with status 404 after 3 attempts`);
                        }
                    }

                    // Check if we should retry indefinitely
                    if (shouldRetryIndefinitely(response)) {
                        context.log.warn(`${dataType} fetch failed with retriable error, will retry indefinitely`, {
                            cid,
                            endpoint: endpoint.url,
                            status: response.status,
                            statusText: response.statusText,
                            attempt: totalAttempts
                        });
                    } else {
                        context.log.error(`${dataType} fetch failed with non-retriable error, stopping`, {
                            cid,
                            endpoint: endpoint.url,
                            status: response.status,
                            statusText: response.statusText,
                            attempt: totalAttempts
                        });
                        throw new Error(`${dataType} fetch failed with non-retriable status ${response.status}: ${response.statusText}`);
                    }
                }
            } catch (e) {
                const error = e as Error;
                if (error.message.includes('fetch failed with non-retriable status')) {
                    throw error;
                }
                const cause = (error as any)?.cause;

                // Extract detailed error information
                const errorDetails = {
                    cid,
                    endpoint: endpoint.url,
                    error: error.message,
                    errorName: error.name,
                    attempt: totalAttempts,
                    fullUrl: buildGatewayUrl(endpoint.url, cid, endpoint.token),
                    errorStack: error.stack,
                    errorCause: cause,
                    // Additional diagnostic info
                    causeCode: cause?.code,
                    causeErrno: cause?.errno,
                    causeSystemCall: cause?.syscall,
                    causeAddress: cause?.address,
                    causePort: cause?.port,
                    userAgent: 'Envio-Indexer/1.0',
                    timestamp: new Date().toISOString(),
                    // Network diagnostic hints
                    possibleCause: error.message?.includes('ENOTFOUND') ? 'DNS_RESOLUTION_FAILED' :
                                 error.message?.includes('ECONNREFUSED') ? 'CONNECTION_REFUSED' :
                                 error.message?.includes('ETIMEDOUT') ? 'CONNECTION_TIMEOUT' :
                                 error.message?.includes('ECONNRESET') ? 'CONNECTION_RESET' :
                                 error.message?.includes('timeout') ? 'TIMEOUT' :
                                 error.name === 'AbortError' ? 'REQUEST_ABORTED' :
                                 'UNKNOWN_NETWORK_ERROR'
                };

                if (shouldRetryIndefinitely(undefined, error)) {
                    context.log.warn(`${dataType} fetch failed with retriable connection error, will retry indefinitely`, errorDetails);
                } else {
                    context.log.error(`${dataType} fetch failed with non-retriable error, stopping`, {
                        ...errorDetails,
                        errorStringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
                    });
                    throw new Error(`${dataType} fetch failed with non-retriable error: ${error.message}`);
                }
            }

            // No delay between gateways - try them as fast as possible
        }

        // After trying all endpoints, wait a short time before starting another full cycle
        context.log.info(`Completed full gateway cycle (${totalAttempts} attempts), waiting before retry`, {
            cid,
            dataType,
            totalAttempts
        });
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay between full cycles
    }
}

// Helper function specifically for IPFS metadata with infinite retry
async function fetchIpfsMetadataWithInfiniteRetry(
    context: EffectContext,
    cid: string
): Promise<IpfsMetadata> {
    return fetchDataWithInfiniteRetry(
        context,
        cid,
        "IPFS metadata",
        (data) => data && typeof data === 'object' && data.label && typeof data.label === 'string',
        (data) => ({
            label: data.label,
            relationships: data.relationships
        })
    );
}

// DEPRECATED: This function has been replaced by fetchDataWithInfiniteRetry
// Keeping only for getRelationshipData which needs limited retries
async function fetchDataWithLimitedRetry<T>(
    context: EffectContext,
    cid: string,
    dataType: string,
    validator: (data: any) => boolean,
    transformer: (data: any) => T,
    maxAttempts: number = 3
): Promise<T> {
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const fullUrl = buildGatewayUrl(endpoint.url, cid, endpoint.token);
                const response = await fetch(fullUrl);

                if (response.ok) {
                    const data: any = await response.json();
                    if (validator(data)) {
                        if (attempt > 0) {
                            context.log.info(`${dataType} fetch succeeded on attempt ${attempt + 1}`, {
                                cid,
                                endpoint: endpoint.url
                            });
                        }
                        return transformer(data);
                    }
                } else {
                    context.log.warn(`${dataType} fetch failed - HTTP error`, {
                        cid,
                        endpoint: endpoint.url,
                        status: response.status,
                        statusText: response.statusText,
                        attempt: attempt + 1,
                        maxAttempts
                    });
                }
            } catch (e) {
                const error = e as Error;
                context.log.warn(`Failed to fetch ${dataType}`, {
                    cid,
                    endpoint: endpoint.url,
                    error: error.message,
                    errorName: error.name,
                    attempt: attempt + 1,
                    maxAttempts
                });
            }

            // Wait before retry (except on last attempt)
            if (attempt < maxAttempts - 1) {
                await waitWithBackoff(attempt);
            }
        }

        // No delay between endpoints - try them as fast as possible
    }

    context.log.error(`Unable to fetch ${dataType} from all gateways`, { cid });
    throw new Error(`Failed to fetch ${dataType} for CID: ${cid}`);
}

// Fetch relationship data (from/to structure)
export const getRelationshipData = experimental_createEffect(
    {
        name: "getRelationshipData",
        input: S.string,
        output: relationshipSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "relationship data",
            (data: any) => data && data.to && data.to["/"],
            (data: any) => data
        );
    }
);

// Fetch structure data (roof_date)
export const getStructureData = experimental_createEffect(
    {
        name: "getStructureData",
        input: S.string,
        output: structureSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "structure data",
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                roof_date: data.roof_date || undefined,
                architectural_style_type: data.architectural_style_type || undefined,
                attachment_type: data.attachment_type || undefined,
                ceiling_condition: data.ceiling_condition || undefined,
                ceiling_height_average: data.ceiling_height_average || undefined,
                ceiling_insulation_type: data.ceiling_insulation_type || undefined,
                ceiling_structure_material: data.ceiling_structure_material || undefined,
                ceiling_surface_material: data.ceiling_surface_material || undefined,
                exterior_door_installation_date: data.exterior_door_installation_date || undefined,
                exterior_door_material: data.exterior_door_material || undefined,
                exterior_wall_condition: data.exterior_wall_condition || undefined,
                exterior_wall_insulation_type: data.exterior_wall_insulation_type || undefined,
                exterior_wall_material_primary: data.exterior_wall_material_primary || undefined,
                exterior_wall_material_secondary: data.exterior_wall_material_secondary || undefined,
                exterior_wall_insulation_type_primary: data.exterior_wall_insulation_type_primary || undefined,
                exterior_wall_insulation_type_secondary: data.exterior_wall_insulation_type_secondary || undefined,
                finished_base_area: data.finished_base_area || undefined,
                finished_basement_area: data.finished_basement_area || undefined,
                finished_upper_story_area: data.finished_upper_story_area || undefined,
                flooring_condition: data.flooring_condition || undefined,
                flooring_material_primary: data.flooring_material_primary || undefined,
                flooring_material_secondary: data.flooring_material_secondary || undefined,
                foundation_condition: data.foundation_condition || undefined,
                foundation_material: data.foundation_material || undefined,
                foundation_repair_date: data.foundation_repair_date || undefined,
                foundation_type: data.foundation_type || undefined,
                foundation_waterproofing: data.foundation_waterproofing || undefined,
                gutters_condition: data.gutters_condition || undefined,
                gutters_material: data.gutters_material || undefined,
                interior_door_material: data.interior_door_material || undefined,
                interior_wall_condition: data.interior_wall_condition || undefined,
                interior_wall_finish_primary: data.interior_wall_finish_primary || undefined,
                interior_wall_finish_secondary: data.interior_wall_finish_secondary || undefined,
                interior_wall_structure_material: data.interior_wall_structure_material || undefined,
                interior_wall_structure_material_primary: data.interior_wall_structure_material_primary || undefined,
                interior_wall_structure_material_secondary: data.interior_wall_structure_material_secondary || undefined,
                interior_wall_surface_material_primary: data.interior_wall_surface_material_primary || undefined,
                interior_wall_surface_material_secondary: data.interior_wall_surface_material_secondary || undefined,
                number_of_buildings: data.number_of_buildings || undefined,
                number_of_stories: data.number_of_stories || undefined,
                primary_framing_material: data.primary_framing_material || undefined,
                request_identifier: data.request_identifier || undefined,
                roof_age_years: data.roof_age_years || undefined,
                roof_condition: data.roof_condition || undefined,
                roof_covering_material: data.roof_covering_material || undefined,
                roof_design_type: data.roof_design_type || undefined,
                roof_material_type: data.roof_material_type || undefined,
                roof_structure_material: data.roof_structure_material || undefined,
                roof_underlayment_type: data.roof_underlayment_type || undefined,
                secondary_framing_material: data.secondary_framing_material || undefined,
                siding_installation_date: data.siding_installation_date || undefined,
                structural_damage_indicators: data.structural_damage_indicators || undefined,
                subfloor_material: data.subfloor_material || undefined,
                unfinished_base_area: data.unfinished_base_area || undefined,
                unfinished_basement_area: data.unfinished_basement_area || undefined,
                unfinished_upper_story_area: data.unfinished_upper_story_area || undefined,
                window_frame_material: data.window_frame_material || undefined,
                window_glazing_type: data.window_glazing_type || undefined,
                window_installation_date: data.window_installation_date || undefined,
                window_operation_type: data.window_operation_type || undefined,
                window_screen_material: data.window_screen_material || undefined,
            })
        );
    }
);

// Fetch address data
export const getAddressData = experimental_createEffect(
    {
        name: "getAddressData",
        input: S.string,
        output: addressSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "address data",
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                request_identifier: data.request_identifier || undefined,
                block: data.block || undefined,
                city_name: data.city_name || undefined,
                country_code: data.country_code || undefined,
                county_name: data.county_name || undefined,
                latitude: data.latitude || undefined,
                longitude: data.longitude || undefined,
                lot: data.lot || undefined,
                municipality_name: data.municipality_name || undefined,
                plus_four_postal_code: data.plus_four_postal_code || undefined,
                postal_code: data.postal_code || undefined,
                range: data.range || undefined,
                route_number: data.route_number || undefined,
                section: data.section || undefined,
                state_code: data.state_code || undefined,
                street_name: data.street_name || undefined,
                street_number: data.street_number || undefined,
                street_post_directional_text: data.street_post_directional_text || undefined,
                street_pre_directional_text: data.street_pre_directional_text || undefined,
                street_suffix_type: data.street_suffix_type || undefined,
                township: data.township || undefined,
                unit_identifier: data.unit_identifier || undefined,
            })
        );
    }
);

// Fetch property data (property_type, built years)
export const getPropertyData = experimental_createEffect(
    {
        name: "getPropertyData",
        input: S.string,
        output: propertySchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "property data",
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                property_type: data.property_type || undefined,
                property_structure_built_year: data.property_structure_built_year ? String(data.property_structure_built_year) : undefined,
                property_effective_built_year: data.property_effective_built_year ? String(data.property_effective_built_year) : undefined,
                parcel_identifier: data.parcel_identifier || undefined,
                area_under_air: data.area_under_air || undefined,
                historic_designation: data.historic_designation || undefined,
                livable_floor_area: data.livable_floor_area || undefined,
                number_of_units: data.number_of_units || undefined,
                number_of_units_type: data.number_of_units_type || undefined,
                property_legal_description_text: data.property_legal_description_text || undefined,
                request_identifier: data.request_identifier || undefined,
                subdivision: data.subdivision || undefined,
                total_area: data.total_area || undefined,
                zoning: data.zoning || undefined,
            })
        );
    }
);


// Fetch fact sheet data (ipfs_url and full_generation_command)
export const getIpfsFactSheetData = experimental_createEffect(
    {
        name: "getIpfsFactSheetData",
        input: S.string,
        output: ipfsFactSheetSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "fact sheet data",
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                ipfs_url: data.ipfs_url || undefined,
                full_generation_command: data.full_generation_command || undefined,
            })
        );
    }
);

export const getIpfsMetadata = experimental_createEffect(
    {
        name: "getIpfsMetadata",
        input: S.string,
        output: ipfsMetadataSchema,
        cache: true, // Enable caching for better performance
    },
    async ({ input: cid, context }) => {
        return fetchIpfsMetadataWithInfiniteRetry(context, cid);
    }
);


// Removed getLotData effect

export const getSalesHistoryData = experimental_createEffect(
    {
        name: "getSalesHistoryData",
        input: S.string,
        output: salesHistorySchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "sales history data",
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                ownership_transfer_date: data.ownership_transfer_date || undefined,
                purchase_price_amount: data.purchase_price_amount || undefined,
                request_identifier: data.request_identifier || undefined,
                sale_type: data.sale_type || undefined,
            })
        );
    }
);

export const getTaxData = experimental_createEffect(
    {
        name: "getTaxData",
        input: S.string,
        output: taxSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "tax data",
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                first_year_building_on_tax_roll: data.first_year_building_on_tax_roll || undefined,
                first_year_on_tax_roll: data.first_year_on_tax_roll || undefined,
                monthly_tax_amount: data.monthly_tax_amount || undefined,
                period_end_date: data.period_end_date || undefined,
                period_start_date: data.period_start_date || undefined,
                property_assessed_value_amount: data.property_assessed_value_amount,
                property_building_amount: data.property_building_amount || undefined,
                property_land_amount: data.property_land_amount || undefined,
                property_market_value_amount: data.property_market_value_amount,
                property_taxable_value_amount: data.property_taxable_value_amount,
                request_identifier: data.request_identifier || undefined,
                tax_year: data.tax_year || undefined,
                yearly_tax_amount: data.yearly_tax_amount || undefined,
            })
        );
    }
);


// Removed getFloodStormData effect

// Removed getPersonData effect

// Removed getCompanyData effect


