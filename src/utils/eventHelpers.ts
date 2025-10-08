import {
  Address,
  Property,
  Ipfs,
  SalesHistory,
  Tax,
  Structure,
} from "generated";
import { getRelationshipData, getAddressData, getPropertyData, getIpfsFactSheetData, getSalesHistoryData, getTaxData, getStructureData } from "./ipfs";

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

// Helper to create Structure entity
export function createStructureEntity(structureId: string, structureData: any): Structure {
  return {
    id: structureId,
    roof_date: structureData.roof_date || undefined,
    architectural_style_type: structureData.architectural_style_type || undefined,
    attachment_type: structureData.attachment_type || undefined,
    ceiling_condition: structureData.ceiling_condition || undefined,
    ceiling_height_average: structureData.ceiling_height_average || undefined,
    ceiling_insulation_type: structureData.ceiling_insulation_type || undefined,
    ceiling_structure_material: structureData.ceiling_structure_material || undefined,
    ceiling_surface_material: structureData.ceiling_surface_material || undefined,
    exterior_door_installation_date: structureData.exterior_door_installation_date || undefined,
    exterior_door_material: structureData.exterior_door_material || undefined,
    exterior_wall_condition: structureData.exterior_wall_condition || undefined,
    exterior_wall_insulation_type: structureData.exterior_wall_insulation_type || undefined,
    exterior_wall_material_primary: structureData.exterior_wall_material_primary || undefined,
    exterior_wall_material_secondary: structureData.exterior_wall_material_secondary || undefined,
    exterior_wall_insulation_type_primary: structureData.exterior_wall_insulation_type_primary || undefined,
    exterior_wall_insulation_type_secondary: structureData.exterior_wall_insulation_type_secondary || undefined,
    finished_base_area: structureData.finished_base_area || undefined,
    finished_basement_area: structureData.finished_basement_area || undefined,
    finished_upper_story_area: structureData.finished_upper_story_area || undefined,
    flooring_condition: structureData.flooring_condition || undefined,
    flooring_material_primary: structureData.flooring_material_primary || undefined,
    flooring_material_secondary: structureData.flooring_material_secondary || undefined,
    foundation_condition: structureData.foundation_condition || undefined,
    foundation_material: structureData.foundation_material || undefined,
    foundation_repair_date: structureData.foundation_repair_date || undefined,
    foundation_type: structureData.foundation_type || undefined,
    foundation_waterproofing: structureData.foundation_waterproofing || undefined,
    gutters_condition: structureData.gutters_condition || undefined,
    gutters_material: structureData.gutters_material || undefined,
    interior_door_material: structureData.interior_door_material || undefined,
    interior_wall_condition: structureData.interior_wall_condition || undefined,
    interior_wall_finish_primary: structureData.interior_wall_finish_primary || undefined,
    interior_wall_finish_secondary: structureData.interior_wall_finish_secondary || undefined,
    interior_wall_structure_material: structureData.interior_wall_structure_material || undefined,
    interior_wall_structure_material_primary: structureData.interior_wall_structure_material_primary || undefined,
    interior_wall_structure_material_secondary: structureData.interior_wall_structure_material_secondary || undefined,
    interior_wall_surface_material_primary: structureData.interior_wall_surface_material_primary || undefined,
    interior_wall_surface_material_secondary: structureData.interior_wall_surface_material_secondary || undefined,
    number_of_buildings: structureData.number_of_buildings || undefined,
    number_of_stories: structureData.number_of_stories || undefined,
    primary_framing_material: structureData.primary_framing_material || undefined,
    request_identifier: structureData.request_identifier || undefined,
    roof_age_years: structureData.roof_age_years || undefined,
    roof_condition: structureData.roof_condition || undefined,
    roof_covering_material: structureData.roof_covering_material || undefined,
    roof_design_type: structureData.roof_design_type || undefined,
    roof_material_type: structureData.roof_material_type || undefined,
    roof_structure_material: structureData.roof_structure_material || undefined,
    roof_underlayment_type: structureData.roof_underlayment_type || undefined,
    secondary_framing_material: structureData.secondary_framing_material || undefined,
    siding_installation_date: structureData.siding_installation_date || undefined,
    structural_damage_indicators: structureData.structural_damage_indicators || undefined,
    subfloor_material: structureData.subfloor_material || undefined,
    unfinished_base_area: structureData.unfinished_base_area || undefined,
    unfinished_basement_area: structureData.unfinished_basement_area || undefined,
    unfinished_upper_story_area: structureData.unfinished_upper_story_area || undefined,
    window_frame_material: structureData.window_frame_material || undefined,
    window_glazing_type: structureData.window_glazing_type || undefined,
    window_installation_date: structureData.window_installation_date || undefined,
    window_operation_type: structureData.window_operation_type || undefined,
    window_screen_material: structureData.window_screen_material || undefined
  };
}

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
  let structureId: string | undefined;
  let addressId: string | undefined;
  let propertyDataId: string | undefined;
  let ipfsId: string | undefined;
  let parcelIdentifier: string | undefined;
  const salesHistoryEntities: SalesHistory[] = [];
  const taxEntities: Tax[] = [];

  // PHASE 1: Resolve property/address/ipfs/structure first to get parcelIdentifier
  const structureCid = metadata.relationships?.property_has_structure?.["/"];
  const propertyAddressCid = metadata.relationships?.property_has_address?.["/"];
  const addressFactSheetCid = metadata.relationships?.address_has_fact_sheet?.[0]?.["/"];

  const phase1RelPromises: any[] = [];
  if (structureCid) {
    phase1RelPromises.push(
      context.effect(getRelationshipData, structureCid)
        .then((data: any) => ({ type: 'structure_rel', data, cid: structureCid }))
        .catch((error: any) => ({ type: 'structure_rel', error, cid: structureCid }))
    );
  }
  if (propertyAddressCid) {
    phase1RelPromises.push(
      context.effect(getRelationshipData, propertyAddressCid)
        .then((data: any) => ({ type: 'property_rel', data, cid: propertyAddressCid }))
        .catch((error: any) => ({ type: 'property_rel', error, cid: propertyAddressCid }))
    );
  }
  if (addressFactSheetCid) {
    phase1RelPromises.push(
      context.effect(getRelationshipData, addressFactSheetCid)
        .then((data: any) => ({ type: 'address_rel', data, cid: addressFactSheetCid }))
        .catch((error: any) => ({ type: 'address_rel', error, cid: addressFactSheetCid }))
    );
  }

  const phase1RelResults = await Promise.all(phase1RelPromises);

  let structureDataCid: string | undefined;
  let propertyDataCid: string | undefined;
  let addressDataCid: string | undefined;
  let ipfsDataCid: string | undefined;

  for (const rel of phase1RelResults) {
    if (rel.type === 'structure_rel' && !rel.error) {
      structureDataCid = rel.data.to?.["/"];
    } else if (rel.type === 'property_rel' && !rel.error) {
      propertyDataCid = rel.data.from?.["/"] || rel.data.to?.["/"];
    } else if (rel.type === 'address_rel' && !rel.error) {
      addressDataCid = rel.data.from?.["/"];
      ipfsDataCid = rel.data.to?.["/"];
    }
  }

  const phase1DataPromises: any[] = [];
  if (structureDataCid) {
    phase1DataPromises.push(
      context.effect(getStructureData, structureDataCid)
        .then((data: any) => ({ type: 'structure', data, cid: structureDataCid }))
        .catch((error: any) => ({ type: 'structure', error, cid: structureDataCid }))
    );
  }
  if (propertyDataCid) {
    phase1DataPromises.push(
      context.effect(getPropertyData, propertyDataCid)
        .then((data: any) => ({ type: 'property', data, cid: propertyDataCid }))
        .catch((error: any) => ({ type: 'property', error, cid: propertyDataCid }))
    );
  }
  if (addressDataCid) {
    phase1DataPromises.push(
      context.effect(getAddressData, addressDataCid)
        .then((data: any) => ({ type: 'address', data, cid: addressDataCid }))
        .catch((error: any) => ({ type: 'address', error, cid: addressDataCid }))
    );
  }
  if (ipfsDataCid) {
    phase1DataPromises.push(
      context.effect(getIpfsFactSheetData, ipfsDataCid)
        .then((data: any) => ({ type: 'ipfs', data, cid: ipfsDataCid }))
        .catch((error: any) => ({ type: 'ipfs', error, cid: ipfsDataCid }))
    );
  }

  const phase1DataResults = await Promise.all(phase1DataPromises);

  for (const result of phase1DataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, { cid, error: result.error.message });
      continue;
    }
    if (result.type === 'structure') {
      structureId = result.cid;
      const structureEntity = createStructureEntity(result.cid, result.data);
      context.Structure.set(structureEntity);
    } else if (result.type === 'property') {
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

  // PHASE 2: sales/tax relationships and data using final propertyId
  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];

  const phase2RelPromises: any[] = [];
  for (const salesHistoryRef of salesHistoryCids) {
    const salesHistoryRelCid = salesHistoryRef?.["/"];
    if (salesHistoryRelCid) {
      phase2RelPromises.push(
        context.effect(getRelationshipData, salesHistoryRelCid)
          .then((data: any) => ({ type: 'sales_history_rel', data, cid: salesHistoryRelCid }))
          .catch((error: any) => ({ type: 'sales_history_rel', error, cid: salesHistoryRelCid }))
      );
    }
  }
  for (const taxRef of taxCids) {
    const taxRelCid = taxRef?.["/"];
    if (taxRelCid) {
      phase2RelPromises.push(
        context.effect(getRelationshipData, taxRelCid)
          .then((data: any) => ({ type: 'tax_rel', data, cid: taxRelCid }))
          .catch((error: any) => ({ type: 'tax_rel', error, cid: taxRelCid }))
      );
    }
  }

  const phase2RelResults = await Promise.all(phase2RelPromises);

  const phase2DataPromises: any[] = [];
  for (const rel of phase2RelResults) {
    if (rel.error) continue;
    if (rel.type === 'sales_history_rel') {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push(
          context.effect(getSalesHistoryData, targetCid)
            .then((data: any) => ({ type: 'sales_history', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'sales_history', error, cid: targetCid }))
        );
      }
    } else if (rel.type === 'tax_rel') {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push(
          context.effect(getTaxData, targetCid)
            .then((data: any) => ({ type: 'tax', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'tax', error, cid: targetCid }))
        );
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
      const salesHistoryEntity = createSalesHistoryEntity(result.cid, result.data, propertyIdForChildren);
      context.SalesHistory.set(salesHistoryEntity);
      salesHistoryEntities.push(salesHistoryEntity);
    } else if (result.type === 'tax') {
      const taxEntity = createTaxEntity(result.cid, result.data, propertyIdForChildren);
      context.Tax.set(taxEntity);
      taxEntities.push(taxEntity);
    }
  }

  return {
    structureId,
    addressId,
    propertyDataId,
    ipfsId,
    taxEntities,
    parcelIdentifier,
    salesHistoryEntities,
  }
  
    }