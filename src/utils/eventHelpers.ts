import {
  Address,
  Property,
  Ipfs,
  SalesHistory,
  Tax,
} from "generated";
import { getRelationshipData, getAddressData, getPropertyData, getIpfsFactSheetData, getSalesHistoryData, getTaxData } from "./ipfs";

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

  // PHASE 1: Resolve property/address/ipfs first to get parcelIdentifier
  const propertyAddressCid = metadata.relationships?.property_has_address?.["/"];
  const addressFactSheetCid = metadata.relationships?.address_has_fact_sheet?.[0]?.["/"];

  let propertyDataCid: string | undefined;
  let addressDataCid: string | undefined;
  let ipfsDataCid: string | undefined;

  if (propertyAddressCid) {
    try {
      const rel = await context.effect(getRelationshipData, propertyAddressCid);
      propertyDataCid = rel.from?.["/"] || rel.to?.["/"];
    } catch (error) {
      context.log.warn('Failed to fetch property_rel', { cid: propertyAddressCid, error: (error as Error).message });
    }
  }
  if (addressFactSheetCid) {
    try {
      const rel = await context.effect(getRelationshipData, addressFactSheetCid);
      addressDataCid = rel.from?.["/"];
      ipfsDataCid = rel.to?.["/"];
    } catch (error) {
      context.log.warn('Failed to fetch address_rel', { cid: addressFactSheetCid, error: (error as Error).message });
    }
  }

  if (propertyDataCid) {
    try {
      const data = await context.effect(getPropertyData, propertyDataCid);
      propertyDataId = propertyDataCid;
      const propertyEntity = createPropertyEntity(propertyDataCid, data);
      context.Property.set(propertyEntity);
      if (data.parcel_identifier) {
        parcelIdentifier = data.parcel_identifier;
      }
    } catch (error) {
      context.log.warn('Failed to fetch property data', { cid: propertyDataCid, error: (error as Error).message });
    }
  }
  if (addressDataCid) {
    try {
      const data = await context.effect(getAddressData, addressDataCid);
      addressId = addressDataCid;
      const addressEntity = createAddressEntity(addressDataCid, data);
      context.Address.set(addressEntity);
    } catch (error) {
      context.log.warn('Failed to fetch address data', { cid: addressDataCid, error: (error as Error).message });
    }
  }
  if (ipfsDataCid) {
    try {
      const data = await context.effect(getIpfsFactSheetData, ipfsDataCid);
      ipfsId = ipfsDataCid;
      const ipfsEntity = createIpfsEntity(ipfsDataCid, data);
      context.Ipfs.set(ipfsEntity);
    } catch (error) {
      context.log.warn('Failed to fetch ipfs fact sheet data', { cid: ipfsDataCid, error: (error as Error).message });
    }
  }

  if (!parcelIdentifier) {
    context.log.error("parcel_identifier missing; aborting sales/tax creation", {
      propertyHash: propertyEntityId,
      cid,
    });
    return {
      addressId,
      propertyDataId,
      ipfsId,
      taxEntities,
      parcelIdentifier,
      salesHistoryEntities,
    };
  }
  const propertyIdForChildren = parcelIdentifier;

  // PHASE 2: sales/tax relationships and data using final propertyId (sequential)
  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];

  for (const salesHistoryRef of salesHistoryCids) {
    const relCid = salesHistoryRef?.["/"];
    if (!relCid) continue;
    try {
      const rel = await context.effect(getRelationshipData, relCid);
      const targetCid = rel.to?.["/"] || rel.from?.["/"];
      if (!targetCid) continue;
      try {
        const data = await context.effect(getSalesHistoryData, targetCid);
        const entity = createSalesHistoryEntity(targetCid, data, propertyIdForChildren);
        context.SalesHistory.set(entity);
        salesHistoryEntities.push(entity);
      } catch (error) {
        context.log.warn('Failed to fetch sales history data', { cid: targetCid, error: (error as Error).message });
      }
    } catch (error) {
      context.log.warn('Failed to fetch sales history relationship', { cid: relCid, error: (error as Error).message });
    }
  }

  for (const taxRef of taxCids) {
    const relCid = taxRef?.["/"];
    if (!relCid) continue;
    try {
      const rel = await context.effect(getRelationshipData, relCid);
      const targetCid = rel.to?.["/"] || rel.from?.["/"];
      if (!targetCid) continue;
      try {
        const data = await context.effect(getTaxData, targetCid);
        const entity = createTaxEntity(targetCid, data, propertyIdForChildren);
        context.Tax.set(entity);
        taxEntities.push(entity);
      } catch (error) {
        context.log.warn('Failed to fetch tax data', { cid: targetCid, error: (error as Error).message });
      }
    } catch (error) {
      context.log.warn('Failed to fetch tax relationship', { cid: relCid, error: (error as Error).message });
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