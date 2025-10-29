import { experimental_createEffect, S, type EffectContext } from "envio";
import pThrottle from "p-throttle";
import {
    ipfsMetadataSchema,
    relationshipSchema,
    addressSchema,
    propertySchema,
    ipfsFactSheetSchema,
    salesHistorySchema,
    taxSchema,
    structureSchema,
    utilitySchema,
    layoutSchema,
    lotSchema,
    type IpfsMetadata,
    type RelationshipData,
    type AddressData,
    type PropertyData,
    type IpfsFactSheetData,
    type SalesHistoryData,
    type TaxData,
    type StructureData,
    type UtilityData,
    type LayoutData,
    type LotData
} from "./schemas";

// Environment variable configuration for each data type
interface DataTypeConfig {
    gateway: string;
    token: string | null;
    enabled: boolean;
    throttle: ReturnType<typeof pThrottle>;
}

const RATE_LIMIT = 280; // 280 req/s per gateway

// Store one throttle per unique gateway URL
const gatewayThrottles = new Map<string, ReturnType<typeof pThrottle>>();

// Get or create throttle for a gateway URL
function getThrottleForGateway(gatewayUrl: string): ReturnType<typeof pThrottle> {
    if (!gatewayThrottles.has(gatewayUrl)) {
        console.log(`[Config] Creating new throttle for gateway: ${gatewayUrl} (${RATE_LIMIT} req/s)`);
        gatewayThrottles.set(gatewayUrl, pThrottle({
            limit: RATE_LIMIT,
            interval: 1000, // per second
        }));
    }
    return gatewayThrottles.get(gatewayUrl)!;
}

// Read configuration from environment variables
function loadDataTypeConfig(dataType: string): DataTypeConfig | null {
    const gatewayKey = `ENVIO_${dataType.toUpperCase()}_IPFS_GATEWAY`;
    const tokenKey = `ENVIO_${dataType.toUpperCase()}_GATEWAY_TOKEN`;

    const gateway = process.env[gatewayKey];
    const token = process.env[tokenKey] || null;

    if (!gateway) {
        console.log(`[Config] ${dataType} data type not configured (missing ${gatewayKey})`);
        return null;
    }

    console.log(`[Config] ${dataType} data type enabled with gateway: ${gateway}`);

    return {
        gateway,
        token,
        enabled: true,
        throttle: getThrottleForGateway(gateway)
    };
}

// Load all configurations
const configs = {
    address: loadDataTypeConfig('address'),
    property: loadDataTypeConfig('property'),
    sales_history: loadDataTypeConfig('sales_history'),
    tax: loadDataTypeConfig('tax'),
};

// Validate REQUIRED data types (property, address). Sales/tax are optional.
if (!configs.property) {
    const errorMsg = `[Config] ERROR: Property configuration is REQUIRED!
  Please set:
  - ENVIO_PROPERTY_IPFS_GATEWAY
  - ENVIO_PROPERTY_GATEWAY_TOKEN

  Property gateway is used to fetch:
  - Metadata (label, relationships)
  - Property data (including parcel_identifier which is used as entity ID)
  - Fact sheets

  Without property configuration, the indexer cannot function.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
}

if (!configs.address) {
    const errorMsg = `[Config] ERROR: Address configuration is REQUIRED!
  Please set:
  - ENVIO_ADDRESS_IPFS_GATEWAY
  - ENVIO_ADDRESS_GATEWAY_TOKEN`;
    console.error(errorMsg);
    throw new Error(errorMsg);
}

// Create non-nullable configs for TypeScript
const propertyConfig: DataTypeConfig = configs.property;
const addressConfig: DataTypeConfig = configs.address;

console.log(`[Config] Property (REQUIRED): ${propertyConfig.gateway}`);
console.log(`[Config] Address  (REQUIRED): ${addressConfig.gateway}`);
if (configs.sales_history) {
    console.log(`[Config] Sales    (ENABLED): ${configs.sales_history.gateway}`);
} else {
    console.log(`[Config] Sales    (DISABLED)`);
}
if (configs.tax) {
    console.log(`[Config] Tax      (ENABLED): ${configs.tax.gateway}`);
} else {
    console.log(`[Config] Tax      (DISABLED)`);
}

// Convert bytes32 to CID (same as subgraph implementation)
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

// Export configuration for use in EventHandlers
export const dataTypeConfigs = configs;

// Helper function to build URL with optional token
function buildGatewayUrl(baseUrl: string, cid: string, token: string | null): string {
    const url = `${baseUrl}/${cid}`;
    if (token) {
        return `${url}?pinataGatewayToken=${token}`;
    }
    return url;
}

// Removed legacy selective retry helpers; all non-404 errors now retry indefinitely

// Helper function to wait with exponential backoff
async function waitWithBackoff(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
}

// Generic fetch function with config-specific rate limiting
async function fetchDataWithInfiniteRetry<T>(
    context: EffectContext,
    cid: string,
    dataType: string,
    config: DataTypeConfig,
    validator: (data: any) => boolean,
    transformer: (data: any) => T
): Promise<T> {
    let totalAttempts = 0;
    let notFoundAttempts = 0;

    while (true) {
        totalAttempts++;
        const attemptStartMs = Date.now();

        try {
            const fullUrl = buildGatewayUrl(config.gateway, cid, config.token);

            // Use shared throttle for this gateway (280 req/s per unique gateway URL)
            const throttledFetch = config.throttle(async () => {
                return await fetch(fullUrl);
            });

            const response = await throttledFetch();

            if (response.ok) {
                const data: any = await response.json();
                if (validator(data)) {
                    const durationMs = Date.now() - attemptStartMs;
                    if (totalAttempts > 1) {
                        context.log.info(`${dataType} fetch succeeded after ${totalAttempts} attempts`, {
                            cid,
                            gateway: config.gateway,
                            durationMs
                        });
                    }
                    return transformer(data);
                } else {
                    const durationMs = Date.now() - attemptStartMs;
                    context.log.warn(`${dataType} validation failed`, {
                        cid,
                        gateway: config.gateway,
                        attempt: totalAttempts,
                        durationMs
                    });
                }
            } else {
                // Special-case: 404 should retry only 3 times, then error
                if (response.status === 404) {
                    notFoundAttempts++;
                    const durationMs = Date.now() - attemptStartMs;
                    if (notFoundAttempts < 3) {
                        context.log.warn(`${dataType} fetch returned 404, will retry`, {
                            cid,
                            gateway: config.gateway,
                            status: response.status,
                            attempt404: notFoundAttempts,
                            attempt: totalAttempts,
                            durationMs
                        });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    } else {
                        context.log.error(`${dataType} fetch returned 404 after 3 attempts, stopping`, {
                            cid,
                            gateway: config.gateway,
                            status: response.status,
                            durationMs
                        });
                        throw new Error(`${dataType} fetch failed with status 404 after 3 attempts`);
                    }
                }

                // For ANY other non-OK status (not 404), retry indefinitely
                const durationMs = Date.now() - attemptStartMs;
                context.log.warn(`${dataType} fetch failed with HTTP status, will retry`, {
                    cid,
                    gateway: config.gateway,
                    status: response.status,
                    attempt: totalAttempts,
                    durationMs
                });
                await new Promise(resolve => setTimeout(resolve, 1500));
                continue;
                }
        } catch (e) {
            const error = e as Error;
            if (error.message.includes('fetch failed with non-retriable status') || error.message.includes('404 after 3 attempts')) {
                throw error;
            }
            const cause = (error as any)?.cause;
            const durationMs = Date.now() - attemptStartMs;

            // Extract detailed error information
            const errorDetails: any = {
                cid,
                gateway: config.gateway,
                error: error.message,
                errorName: error.name,
                attempt: totalAttempts,
                durationMs,
                fullErrorMessage: error.toString(),
                errorStack: error.stack,
            };

            // Add cause details if available
            if (cause) {
                errorDetails.causeMessage = cause.message || String(cause);
                errorDetails.causeName = cause.name;
                errorDetails.causeCode = cause.code;
                if (cause.stack) {
                    errorDetails.causeStack = cause.stack;
                }
            }

            // Determine possible cause category
            errorDetails.possibleCause = error.message?.includes('ENOTFOUND') ? 'DNS_RESOLUTION_FAILED' :
                         error.message?.includes('ECONNREFUSED') ? 'CONNECTION_REFUSED' :
                         error.message?.includes('ETIMEDOUT') ? 'CONNECTION_TIMEOUT' :
                         error.message?.includes('ECONNRESET') ? 'CONNECTION_RESET' :
                         error.message?.includes('timeout') ? 'TIMEOUT' :
                         error.name === 'AbortError' ? 'REQUEST_ABORTED' :
                         cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ? 'UNDICI_CONNECT_TIMEOUT' :
                         cause?.name === 'ConnectTimeoutError' ? 'CONNECT_TIMEOUT' :
                         'UNKNOWN_NETWORK_ERROR';

            // Retry indefinitely for ANY runtime error (network/timeouts/etc.)
            context.log.warn(`${dataType} fetch failed with runtime error, will retry`, errorDetails);
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
        }
    }
}

// ========================================
// CONDITIONAL EFFECT EXPORTS
// Only export effects for configured data types
// ========================================

// IPFS Metadata - uses property gateway (REQUIRED)
export const getIpfsMetadata = experimental_createEffect(
    {
        name: "getIpfsMetadata",
        input: S.string,
        output: ipfsMetadataSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "IPFS metadata",
            propertyConfig,
            (data) => data && typeof data === 'object' && data.label && typeof data.label === 'string',
            (data) => ({
                label: data.label,
                relationships: data.relationships
            })
        );
    }
);

// Relationship data - uses property gateway (REQUIRED)
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
            propertyConfig,
            (data: any) => data && data.to && data.to["/"],
            (data: any) => data
        );
    }
);

// Address data - conditional
export const getAddressData = configs.address ? experimental_createEffect(
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
            configs.address!,
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
                unnormalized_address: data.unnormalized_address || undefined,
            })
        );
    }
) : null;

// Property data - uses property gateway (REQUIRED)
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
            propertyConfig,
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                property_type: data.property_type || undefined,
                build_status: data.build_status || undefined,
                property_structure_built_year: data.property_structure_built_year ? String(data.property_structure_built_year) : undefined,
                property_effective_built_year: data.property_effective_built_year ? String(data.property_effective_built_year) : undefined,
                parcel_identifier: data.parcel_identifier || undefined,
                area_under_air: data.area_under_air || undefined,
                historic_designation: data.historic_designation || undefined,
                livable_floor_area: data.livable_floor_area || undefined,
                number_of_units: data.number_of_units || undefined,
                number_of_units_type: data.number_of_units_type || undefined,
                ownership_estate_type: data.ownership_estate_type || undefined,
                property_legal_description_text: data.property_legal_description_text || undefined,
                property_usage_type: data.property_usage_type || undefined,
                request_identifier: data.request_identifier || undefined,
                structure_form: data.structure_form || undefined,
                subdivision: data.subdivision || undefined,
                total_area: data.total_area || undefined,
                zoning: data.zoning || undefined,
            })
        );
    }
);

// Sales History data - conditional
export const getSalesHistoryData = configs.sales_history ? experimental_createEffect(
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
            configs.sales_history!,
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                ownership_transfer_date: data.ownership_transfer_date || undefined,
                purchase_price_amount: data.purchase_price_amount || undefined,
                request_identifier: data.request_identifier || undefined,
                sale_type: data.sale_type || undefined,
            })
        );
    }
) : null;

// Tax data - conditional
export const getTaxData = configs.tax ? experimental_createEffect(
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
            configs.tax!,
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
) : null;

// Fact sheet data - uses property gateway (REQUIRED)
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
            propertyConfig,
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                ipfs_url: data.ipfs_url || undefined,
                full_generation_command: data.full_generation_command || undefined,
            })
        );
    }
);

// Structure data - uses property gateway (REQUIRED)
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
            propertyConfig,
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
                exterior_door_material: data.exterior_door_material || undefined,
                exterior_wall_condition: data.exterior_wall_condition || undefined,
                exterior_wall_insulation_type: data.exterior_wall_insulation_type || undefined,
                exterior_wall_material_primary: data.exterior_wall_material_primary || undefined,
                exterior_wall_material_secondary: data.exterior_wall_material_secondary || undefined,
                flooring_condition: data.flooring_condition || undefined,
                flooring_material_primary: data.flooring_material_primary || undefined,
                flooring_material_secondary: data.flooring_material_secondary || undefined,
                foundation_condition: data.foundation_condition || undefined,
                foundation_material: data.foundation_material || undefined,
                foundation_type: data.foundation_type || undefined,
                foundation_waterproofing: data.foundation_waterproofing || undefined,
                gutters_condition: data.gutters_condition || undefined,
                gutters_material: data.gutters_material || undefined,
                interior_door_material: data.interior_door_material || undefined,
                interior_wall_condition: data.interior_wall_condition || undefined,
                interior_wall_finish_primary: data.interior_wall_finish_primary || undefined,
                interior_wall_finish_secondary: data.interior_wall_finish_secondary || undefined,
                interior_wall_structure_material: data.interior_wall_structure_material || undefined,
                interior_wall_surface_material_primary: data.interior_wall_surface_material_primary || undefined,
                interior_wall_surface_material_secondary: data.interior_wall_surface_material_secondary || undefined,
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
                structural_damage_indicators: data.structural_damage_indicators || undefined,
                subfloor_material: data.subfloor_material || undefined,
                window_frame_material: data.window_frame_material || undefined,
                window_glazing_type: data.window_glazing_type || undefined,
                window_operation_type: data.window_operation_type || undefined,
                window_screen_material: data.window_screen_material || undefined,
            })
        );
    }
);

// Utility data - uses property gateway (REQUIRED)
export const getUtilityData = experimental_createEffect(
    {
        name: "getUtilityData",
        input: S.string,
        output: utilitySchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "utility data",
            propertyConfig,
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                cooling_system_type: data.cooling_system_type || undefined,
                electrical_panel_capacity: data.electrical_panel_capacity || undefined,
                electrical_wiring_type: data.electrical_wiring_type || undefined,
                electrical_wiring_type_other_description: data.electrical_wiring_type_other_description || undefined,
                heating_system_type: data.heating_system_type || undefined,
                hvac_condensing_unit_present: data.hvac_condensing_unit_present || undefined,
                hvac_unit_condition: data.hvac_unit_condition || undefined,
                hvac_unit_issues: data.hvac_unit_issues || undefined,
                plumbing_system_type: data.plumbing_system_type || undefined,
                plumbing_system_type_other_description: data.plumbing_system_type_other_description || undefined,
                public_utility_type: data.public_utility_type || undefined,
                request_identifier: data.request_identifier || undefined,
                sewer_type: data.sewer_type || undefined,
                smart_home_features: data.smart_home_features || undefined,
                smart_home_features_other_description: data.smart_home_features_other_description || undefined,
                solar_inverter_visible: data.solar_inverter_visible || undefined,
                solar_panel_present: data.solar_panel_present || undefined,
                solar_panel_type: data.solar_panel_type || undefined,
                solar_panel_type_other_description: data.solar_panel_type_other_description || undefined,
                water_source_type: data.water_source_type || undefined,
            })
        );
    }
);

// Layout data - uses property gateway (REQUIRED)
export const getLayoutData = experimental_createEffect(
    {
        name: "getLayoutData",
        input: S.string,
        output: layoutSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "layout data",
            propertyConfig,
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                cabinet_style: data.cabinet_style || undefined,
                clutter_level: data.clutter_level || undefined,
                condition_issues: data.condition_issues || undefined,
                countertop_material: data.countertop_material || undefined,
                decor_elements: data.decor_elements || undefined,
                design_style: data.design_style || undefined,
                fixture_finish_quality: data.fixture_finish_quality || undefined,
                floor_level: data.floor_level || undefined,
                flooring_material_type: data.flooring_material_type || undefined,
                flooring_wear: data.flooring_wear || undefined,
                furnished: data.furnished || undefined,
                has_windows: data.has_windows || undefined,
                is_exterior: data.is_exterior || false,
                is_finished: data.is_finished || false,
                lighting_features: data.lighting_features || undefined,
                natural_light_quality: data.natural_light_quality || undefined,
                paint_condition: data.paint_condition || undefined,
                pool_condition: data.pool_condition || undefined,
                pool_equipment: data.pool_equipment || undefined,
                pool_surface_type: data.pool_surface_type || undefined,
                pool_type: data.pool_type || undefined,
                pool_water_quality: data.pool_water_quality || undefined,
                request_identifier: data.request_identifier || undefined,
                safety_features: data.safety_features || undefined,
                size_square_feet: data.size_square_feet || undefined,
                spa_type: data.spa_type || undefined,
                space_index: data.space_index || 0,
                space_type: data.space_type || undefined,
                view_type: data.view_type || undefined,
                visible_damage: data.visible_damage || undefined,
                window_design_type: data.window_design_type || undefined,
                window_material_type: data.window_material_type || undefined,
                window_treatment_type: data.window_treatment_type || undefined,
            })
        );
    }
);

// Lot data - uses property gateway (REQUIRED)
export const getLotData = experimental_createEffect(
    {
        name: "getLotData",
        input: S.string,
        output: lotSchema,
        cache: true,
    },
    async ({ input: cid, context }) => {
        return fetchDataWithInfiniteRetry(
            context,
            cid,
            "lot data",
            propertyConfig,
            (data: any) => data && typeof data === 'object',
            (data: any) => ({
                request_identifier: data.request_identifier || undefined,
            })
        );
    }
);


