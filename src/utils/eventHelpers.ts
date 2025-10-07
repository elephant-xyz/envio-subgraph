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


  // First fetch relationships to get CIDs
  const relationshipPromises = [];

  const propertyAddressCid = metadata.relationships?.property_has_address?.["/"];
  const addressFactSheetCid = metadata.relationships?.address_has_fact_sheet?.[0]?.["/"];
  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];
  

  if (propertyAddressCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyAddressCid)
        .then((data: any) => ({ type: 'property_rel', data, cid: propertyAddressCid }))
        .catch((error: any) => ({ type: 'property_rel', error, cid: propertyAddressCid }))
    );
  }

  if (addressFactSheetCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, addressFactSheetCid)
        .then((data: any) => ({ type: 'address_rel', data, cid: addressFactSheetCid }))
        .catch((error: any) => ({ type: 'address_rel', error, cid: addressFactSheetCid }))
    );
  }

  // Add sales history relationship fetching
  for (const salesHistoryRef of salesHistoryCids) {
    const salesHistoryRelCid = salesHistoryRef?.["/"];
    if (salesHistoryRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, salesHistoryRelCid)
          .then((data: any) => ({ type: 'sales_history_rel', data, cid: salesHistoryRelCid }))
          .catch((error: any) => ({ type: 'sales_history_rel', error, cid: salesHistoryRelCid }))
      );
    }
  }

  // Add tax relationship fetching
  for (const taxRef of taxCids) {
    const taxRelCid = taxRef?.["/"];
    if (taxRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, taxRelCid)
          .then((data: any) => ({ type: 'tax_rel', data, cid: taxRelCid }))
          .catch((error: any) => ({ type: 'tax_rel', error, cid: taxRelCid }))
      );
    }
  }


  // Removed layout, file, deed relationships

  const relationshipResults = await Promise.all(relationshipPromises);

  // Extract all CIDs for parallel fetching
  const allDataPromises = [];
  let propertyDataCid: string | undefined;
  let addressDataCid: string | undefined;
  let ipfsDataCid: string | undefined;

  for (const relationshipResult of relationshipResults) {
    if (relationshipResult.type === 'property_rel' && !relationshipResult.error) {
      // From property_has_address: get property (from)
      propertyDataCid = relationshipResult.data.from?.["/"];
    } else if (relationshipResult.type === 'address_rel' && !relationshipResult.error) {
      addressDataCid = relationshipResult.data.from?.["/"];
      ipfsDataCid = relationshipResult.data.to?.["/"];
    } else if (relationshipResult.type === 'sales_history_rel' && !relationshipResult.error) {
      // From property_has_sales_history: get target CID and fetch sales data
      const targetCid = relationshipResult.data.to?.["/"];
      if (targetCid) {
        allDataPromises.push(
          context.effect(getSalesHistoryData, targetCid)
            .then((data: any) => ({ type: 'sales_history', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'sales_history', error, cid: targetCid }))
        );
      }
    } else if (relationshipResult.type === 'tax_rel' && !relationshipResult.error) {
      // From property_has_tax: get target CID and fetch tax data
      const targetCid = relationshipResult.data.to?.["/"];
      if (targetCid) {
        allDataPromises.push(
          context.effect(getTaxData, targetCid)
            .then((data: any) => ({ type: 'tax', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'tax', error, cid: targetCid }))
        );
      }
    }
  }
  if (propertyDataCid) {
    allDataPromises.push(
      context.effect(getPropertyData, propertyDataCid)
        .then((data: any) => ({ type: 'property', data, cid: propertyDataCid }))
        .catch((error: any) => ({ type: 'property', error, cid: propertyDataCid }))
    );
  }

  if (addressDataCid) {
    allDataPromises.push(
      context.effect(getAddressData, addressDataCid)
        .then((data: any) => ({ type: 'address', data, cid: addressDataCid }))
        .catch((error: any) => ({ type: 'address', error, cid: addressDataCid }))
    );
  }

  if (ipfsDataCid) {
    allDataPromises.push(
      context.effect(getIpfsFactSheetData, ipfsDataCid)
        .then((data: any) => ({ type: 'ipfs', data, cid: ipfsDataCid }))
        .catch((error: any) => ({ type: 'ipfs', error, cid: ipfsDataCid }))
    );
  }



  // Execute all data fetches in parallel
  const allDataResults = await Promise.all(allDataPromises);

  // Process all results
  for (const result of allDataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, {
        cid,
        error: result.error.message
      });
      continue;
    }

    if (result.type === 'property') {
      propertyDataId = result.cid;
      const propertyEntity = createPropertyEntity(result.cid, result.data);
      context.Property.set(propertyEntity);

      if (result.data.parcel_identifier) {
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

    } else if (result.type === 'sales_history') {
      const salesHistoryEntity = createSalesHistoryEntity(result.cid, result.data, propertyEntityId);
      context.SalesHistory.set(salesHistoryEntity);
      salesHistoryEntities.push(salesHistoryEntity);

    } else if (result.type === 'tax') {
      const taxEntity = createTaxEntity(result.cid, result.data, propertyEntityId);
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