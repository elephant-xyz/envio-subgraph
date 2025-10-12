import {
  Address,
  Property,
  Ipfs,
  SalesHistory,
  Tax,
} from "generated";
import { dataTypeConfigs, getRelationshipData, getAddressData, getPropertyData, getIpfsFactSheetData, getSalesHistoryData, getTaxData } from "./ipfs";

// Function to get all wallet addresses from environment variables
export function getAllowedSubmitters(): string[] {
  const wallets: string[] = [];

  // Get all environment variables
  const envVars = process.env;

  // Find all variables that start with ENVIO_WALLET_ADDRESS
  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('ENVIO_WALLET_ADDRESS') && value) {
      wallets.push(value);
    }
  }

  if (wallets.length === 0) {
    throw new Error('CRITICAL: No wallet addresses found in environment variables starting with ENVIO_WALLET_ADDRESS. Indexer cannot proceed without valid wallet addresses.');
  }

  return wallets;
}

// Removed Structure entity creation

// Helper to create Property entity
export function createPropertyEntity(propertyDataId: string, propertyData: any): Property {
  return {
    id: propertyDataId,
    property_type: propertyData.property_type || undefined,
    property_structure_built_year: propertyData.property_structure_built_year || undefined,
    property_effective_built_year: propertyData.property_effective_built_year || undefined,
    parcel_identifier: propertyData.parcel_identifier || undefined,
    area_under_air: propertyData.area_under_air || undefined,
    historic_designation: propertyData.historic_designation || undefined,
    livable_floor_area: propertyData.livable_floor_area || undefined,
    number_of_units: propertyData.number_of_units || undefined,
    number_of_units_type: propertyData.number_of_units_type || undefined,
    property_legal_description_text: propertyData.property_legal_description_text || undefined,
    request_identifier: propertyData.request_identifier || undefined,
    subdivision: propertyData.subdivision || undefined,
    total_area: propertyData.total_area || undefined,
    zoning: propertyData.zoning || undefined
  };
}

// Helper to create Address entity
export function createAddressEntity(addressId: string, addressData: any): Address {
  return {
    id: addressId,
    county_name: addressData.county_name || undefined,
    request_identifier: addressData.request_identifier || undefined,
    block: addressData.block || undefined,
    city_name: addressData.city_name || undefined,
    country_code: addressData.country_code || undefined,
    latitude: addressData.latitude || undefined,
    longitude: addressData.longitude || undefined,
    lot: addressData.lot || undefined,
    municipality_name: addressData.municipality_name || undefined,
    plus_four_postal_code: addressData.plus_four_postal_code || undefined,
    postal_code: addressData.postal_code || undefined,
    range: addressData.range || undefined,
    route_number: addressData.route_number || undefined,
    section: addressData.section || undefined,
    state_code: addressData.state_code || undefined,
    street_direction_prefix: addressData.street_pre_directional_text || undefined,
    street_direction_suffix: addressData.street_post_directional_text || undefined,
    street_name: addressData.street_name || undefined,
    street_number: addressData.street_number || undefined,
    street_suffix: addressData.street_suffix_type || undefined,
    unit_identifier: addressData.unit_identifier || undefined,
    township: addressData.township || undefined
  };
}

// Helper to create IPFS entity
export function createIpfsEntity(ipfsId: string, ipfsData: any): Ipfs {
  return {
    id: ipfsId,
    ipfs_url: ipfsData.ipfs_url || "",
    full_generation_command: ipfsData.full_generation_command || undefined
  };
}

// Helper to create Lot entity
// Removed Lot entity creation as Lot is no longer indexed

// Helper to create SalesHistory entity
export function createSalesHistoryEntity(salesHistoryId: string, salesHistoryData: any, propertyId: string): SalesHistory {
  return {
    id: salesHistoryId,
    ownership_transfer_date: salesHistoryData.ownership_transfer_date || undefined,
    purchase_price_amount: salesHistoryData.purchase_price_amount || undefined,
    request_identifier: salesHistoryData.request_identifier || undefined,
    sale_type: salesHistoryData.sale_type || undefined,
    property_id: propertyId
  };
}

// Helper to create Tax entity
export function createTaxEntity(taxId: string, taxData: any, propertyId: string): Tax {
  return {
    id: taxId,
    first_year_building_on_tax_roll: taxData.first_year_building_on_tax_roll || undefined,
    first_year_on_tax_roll: taxData.first_year_on_tax_roll || undefined,
    monthly_tax_amount: taxData.monthly_tax_amount || undefined,
    period_end_date: taxData.period_end_date || undefined,
    period_start_date: taxData.period_start_date || undefined,
    property_assessed_value_amount: taxData.property_assessed_value_amount,
    property_building_amount: taxData.property_building_amount || undefined,
    property_land_amount: taxData.property_land_amount || undefined,
    property_market_value_amount: taxData.property_market_value_amount,
    property_taxable_value_amount: taxData.property_taxable_value_amount,
    request_identifier: taxData.request_identifier || undefined,
    tax_year: taxData.tax_year || undefined,
    yearly_tax_amount: taxData.yearly_tax_amount || undefined,
    property_id: propertyId
  };
}

// Removed Utility entity creation

// Helper to create FloodStormInformation entity
// Removed FloodStormInformation entity creation

// Helper to create Person entity
// Removed Person entity creation

// Helper to create Company entity
// Removed Company entity creation

// Removed Layout entity creation

// Removed File entity creation

// Removed Deed entity creation

// Helper to process County data with full parallelism
export async function processCountyData(context: any, metadata: any, cid: string, propertyEntityId: string) {
  // Initialize entity IDs that will be populated from IPFS data
  let addressId: string | undefined;
  let propertyDataId: string | undefined;
  let ipfsId: string | undefined;
  let parcelIdentifier: string | undefined;
  const salesHistoryEntities: SalesHistory[] = [];
  const taxEntities: Tax[] = [];

  // PHASE 1: relationships for property/address only
  const propertyAddressCid = metadata.relationships?.property_has_address?.["/"];
  const addressFactSheetCid = metadata.relationships?.address_has_fact_sheet?.[0]?.["/"];
  const phase1RelPromises: any[] = [];

  if (propertyAddressCid) {
    phase1RelPromises.push(
      (async () => {
        const start = Date.now();
        try {
          const data = await context.effect(getRelationshipData, propertyAddressCid);
          const durationMs = Date.now() - start;
          const gateway = dataTypeConfigs.property?.gateway;
          context.log.info("IPFS phase[property_address] relationship fetched", { cid: propertyAddressCid, gateway, durationMs });
          return { type: 'property_rel', data, cid: propertyAddressCid, durationMs };
        } catch (error: any) {
          return { type: 'property_rel', error, cid: propertyAddressCid };
        }
      })()
    );
  }

  if (addressFactSheetCid) {
    phase1RelPromises.push(
      (async () => {
        const start = Date.now();
        try {
          const data = await context.effect(getRelationshipData, addressFactSheetCid);
          const durationMs = Date.now() - start;
          const gateway = dataTypeConfigs.property?.gateway;
          context.log.info("IPFS phase[property_address] address_rel fetched", { cid: addressFactSheetCid, gateway, durationMs });
          return { type: 'address_rel', data, cid: addressFactSheetCid, durationMs };
        } catch (error: any) {
          return { type: 'address_rel', error, cid: addressFactSheetCid };
        }
      })()
    );
  }

  const phase1RelResults = await Promise.all(phase1RelPromises);

  // Build data fetches in parallel
  const allDataPromises: any[] = [];
  let propertyDataCid: string | undefined;
  let addressDataCid: string | undefined;
  let ipfsDataCid: string | undefined;

  for (const rel of phase1RelResults) {
    if (rel.error) continue;
    if (rel.type === 'property_rel') {
      propertyDataCid = rel.data.from?.["/"] || rel.data.to?.["/"];
      // Also derive addressDataCid from property_has_address (to = address)
      if (!addressDataCid) {
        addressDataCid = rel.data.to?.["/"];
      }
    } else if (rel.type === 'address_rel') {
      addressDataCid = rel.data.from?.["/"];
      ipfsDataCid = rel.data.to?.["/"];
    }
  }

  // Property data - always fetched (property is required)
  if (propertyDataCid) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getPropertyData, propertyDataCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.property?.gateway;
        context.log.info("IPFS phase[property_address] property data fetched", { cid: propertyDataCid, gateway, durationMs });
        return { type: 'property', data, cid: propertyDataCid, durationMs };
      } catch (error: any) {
        return { type: 'property', error, cid: propertyDataCid };
      }
    })());
  }

  // Only fetch address data if configured
  if (addressDataCid && dataTypeConfigs.address && getAddressData) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getAddressData, addressDataCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.address?.gateway;
        context.log.info("IPFS phase[property_address] address data fetched", { cid: addressDataCid, gateway, durationMs });
        return { type: 'address', data, cid: addressDataCid, durationMs };
      } catch (error: any) {
        return { type: 'address', error, cid: addressDataCid };
      }
    })());
  }

  // Fact sheet - always fetched (uses property gateway which is required)
  if (ipfsDataCid) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getIpfsFactSheetData, ipfsDataCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.property?.gateway;
        context.log.info("IPFS phase[property_address] fact sheet fetched", { cid: ipfsDataCid, gateway, durationMs });
        return { type: 'ipfs', data, cid: ipfsDataCid, durationMs };
      } catch (error: any) {
        return { type: 'ipfs', error, cid: ipfsDataCid };
      }
    })());
  }

  const allDataResults = await Promise.all(allDataPromises);

  // Process all results
  for (const result of allDataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, { cid, error: result.error.message });
      continue;
    }
    if (result.type === 'property') {
      // Do NOT fallback: only set Property when parcel_identifier is present
      if (!result.data.parcel_identifier) {
        context.log.info("Skipping property entity - no parcel_identifier present", { cid, propertyCid: result.cid });
      } else {
        const effectivePropertyId: string = result.data.parcel_identifier as string;
        propertyDataId = effectivePropertyId;
        const propertyEntity = createPropertyEntity(effectivePropertyId, result.data);
        context.Property.set(propertyEntity);
        parcelIdentifier = result.data.parcel_identifier;
      }
    } else if (result.type === 'address') {
      addressId = result.cid;
      const addressEntity = createAddressEntity(result.cid, result.data);
      context.Address.set(addressEntity);
    } else if (result.type === 'ipfs') {
      ipfsId = result.cid;
      const ipfsEntity = createIpfsEntity(result.cid, result.data);
      context.Ipfs.set(ipfsEntity);
    }
  }

  // PHASE 2: sales/tax requires parcel_identifier. Error out if missing
  if (!parcelIdentifier) {
    const errorMsg = "Phase 2 blocked: parcel_identifier missing after Phase 1";
    context.log.error(errorMsg, { cid, propertyEntityId });
    throw new Error(errorMsg);
  }

  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];

  const phase2RelPromises: any[] = [];
  if (dataTypeConfigs.sales_history && getSalesHistoryData) {
    for (const salesHistoryRef of salesHistoryCids) {
      const salesHistoryRelCid = salesHistoryRef?.["/"];
      if (salesHistoryRelCid) {
        phase2RelPromises.push(
          (async () => {
            const start = Date.now();
            try {
              const data = await context.effect(getRelationshipData, salesHistoryRelCid);
              const durationMs = Date.now() - start;
              const gateway = dataTypeConfigs.property?.gateway;
              context.log.info("IPFS phase[sales_tax] sales relationship fetched", { cid: salesHistoryRelCid, gateway, durationMs });
              return { type: 'sales_history_rel', data, cid: salesHistoryRelCid, durationMs };
            } catch (error: any) {
              return { type: 'sales_history_rel', error, cid: salesHistoryRelCid };
            }
          })()
        );
      }
    }
  }

  if (dataTypeConfigs.tax && getTaxData) {
    for (const taxRef of taxCids) {
      const taxRelCid = taxRef?.["/"];
      if (taxRelCid) {
        phase2RelPromises.push(
          (async () => {
            const start = Date.now();
            try {
              const data = await context.effect(getRelationshipData, taxRelCid);
              const durationMs = Date.now() - start;
              const gateway = dataTypeConfigs.property?.gateway;
              context.log.info("IPFS phase[sales_tax] tax relationship fetched", { cid: taxRelCid, gateway, durationMs });
              return { type: 'tax_rel', data, cid: taxRelCid, durationMs };
            } catch (error: any) {
              return { type: 'tax_rel', error, cid: taxRelCid };
            }
          })()
        );
      }
    }
  }

  const phase2RelResults = await Promise.all(phase2RelPromises);

  const phase2DataPromises: any[] = [];
  for (const rel of phase2RelResults) {
    if (rel.error) continue;
    if (rel.type === 'sales_history_rel' && dataTypeConfigs.sales_history && getSalesHistoryData) {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getSalesHistoryData, targetCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.sales_history?.gateway;
            context.log.info("IPFS phase[sales_tax] sales data fetched", { cid: targetCid, gateway, durationMs });
            return { type: 'sales_history', data, cid: targetCid, durationMs };
          } catch (error: any) {
            return { type: 'sales_history', error, cid: targetCid };
          }
        })());
      }
    } else if (rel.type === 'tax_rel' && dataTypeConfigs.tax && getTaxData) {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getTaxData, targetCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.tax?.gateway;
            context.log.info("IPFS phase[sales_tax] tax data fetched", { cid: targetCid, gateway, durationMs });
            return { type: 'tax', data, cid: targetCid, durationMs };
          } catch (error: any) {
            return { type: 'tax', error, cid: targetCid };
          }
        })());
      }
    }
  }

  const phase2DataResults = await Promise.all(phase2DataPromises);
  for (const result of phase2DataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, { cid, error: result.error.message });
      continue;
    }
    if (result.type === 'sales_history') {
      const salesHistoryEntity = createSalesHistoryEntity(result.cid, result.data, parcelIdentifier);
      context.SalesHistory.set(salesHistoryEntity);
      salesHistoryEntities.push(salesHistoryEntity);
    } else if (result.type === 'tax') {
      const taxEntity = createTaxEntity(result.cid, result.data, parcelIdentifier);
      context.Tax.set(taxEntity);
      taxEntities.push(taxEntity);
    }
  }

  return {
    addressId,
    propertyDataId,
    ipfsId,
    taxEntities,
    parcelIdentifier,
    salesHistoryEntities,
  }
  
    }