import {
  DataSubmittedWithLabel,
  Structure,
  Address,
  MailingAddress,
  Property,
  Ipfs,
  Lot,
  SalesHistory,
  Tax,
  Utility,
  FloodStormInformation,
  Person,
  Company,
  Layout,
  File,
  Deed,
} from "generated";
import { bytes32ToCID, getIpfsMetadata, getLayoutMetadata, getRelationshipData, getStructureData, getAddressData, getMailingAddressData, getPropertyData, getIpfsFactSheetData, getLotData, getSalesHistoryData, getTaxData, getUtilityData, getFloodStormData, getPersonData, getCompanyData, getDeedData,getFileData,getLayoutData } from "./ipfs";

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
export function createStructureEntity(structureId: string, structureData: any, layoutId?: string): Structure {
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
    exterior_door_material: structureData.exterior_door_material || undefined,
    exterior_wall_condition: structureData.exterior_wall_condition || undefined,
    exterior_wall_insulation_type: structureData.exterior_wall_insulation_type || undefined,
    exterior_wall_material_primary: structureData.exterior_wall_material_primary || undefined,
    exterior_wall_material_secondary: structureData.exterior_wall_material_secondary || undefined,
    flooring_condition: structureData.flooring_condition || undefined,
    flooring_material_primary: structureData.flooring_material_primary || undefined,
    flooring_material_secondary: structureData.flooring_material_secondary || undefined,
    foundation_condition: structureData.foundation_condition || undefined,
    foundation_material: structureData.foundation_material || undefined,
    foundation_type: structureData.foundation_type || undefined,
    foundation_waterproofing: structureData.foundation_waterproofing || undefined,
    gutters_condition: structureData.gutters_condition || undefined,
    gutters_material: structureData.gutters_material || undefined,
    interior_door_material: structureData.interior_door_material || undefined,
    interior_wall_condition: structureData.interior_wall_condition || undefined,
    interior_wall_finish_primary: structureData.interior_wall_finish_primary || undefined,
    interior_wall_finish_secondary: structureData.interior_wall_finish_secondary || undefined,
    interior_wall_structure_material: structureData.interior_wall_structure_material || undefined,
    interior_wall_surface_material_primary: structureData.interior_wall_surface_material_primary || undefined,
    interior_wall_surface_material_secondary: structureData.interior_wall_surface_material_secondary || undefined,
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
    structural_damage_indicators: structureData.structural_damage_indicators || undefined,
    subfloor_material: structureData.subfloor_material || undefined,
    window_frame_material: structureData.window_frame_material || undefined,
    window_glazing_type: structureData.window_glazing_type || undefined,
    window_operation_type: structureData.window_operation_type || undefined,
    window_screen_material: structureData.window_screen_material || undefined,
    exterior_door_installation_date: structureData.exterior_door_installation_date || undefined,
    exterior_wall_condition_primary: structureData.exterior_wall_condition_primary || undefined,
    exterior_wall_condition_secondary: structureData.exterior_wall_condition_secondary || undefined,
    exterior_wall_insulation_type_primary: structureData.exterior_wall_insulation_type_primary || undefined,
    exterior_wall_insulation_type_secondary: structureData.exterior_wall_insulation_type_secondary || undefined,
    finished_base_area: structureData.finished_base_area || undefined,
    finished_basement_area: structureData.finished_basement_area || undefined,
    finished_upper_story_area: structureData.finished_upper_story_area || undefined,
    foundation_repair_date: structureData.foundation_repair_date || undefined,
    interior_wall_structure_material_primary: structureData.interior_wall_structure_material_primary || undefined,
    interior_wall_structure_material_secondary: structureData.interior_wall_structure_material_secondary || undefined,
    number_of_buildings: structureData.number_of_buildings || undefined,
    siding_installation_date: structureData.siding_installation_date || undefined,
    unfinished_base_area: structureData.unfinished_base_area || undefined,
    unfinished_basement_area: structureData.unfinished_basement_area || undefined,
    unfinished_upper_story_area: structureData.unfinished_upper_story_area || undefined,
    window_installation_date: structureData.window_installation_date || undefined,
    layout_id: layoutId || undefined
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
    zoning: propertyData.zoning || undefined,
    build_status: propertyData.build_status || undefined,
    ownership_estate_type: propertyData.ownership_estate_type || undefined,
    property_usage_type: propertyData.property_usage_type || undefined,
    structure_form: propertyData.structure_form || undefined
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
    township: addressData.township || undefined,
    unnormalized_address: addressData.unnormalized_address || undefined
  };
}

// Helper to create MailingAddress entity
export function createMailingAddressEntity(mailingAddressId: string, mailingAddressData: any): MailingAddress {
  return {
    id: mailingAddressId,
    unnormalized_address: mailingAddressData.unnormalized_address || undefined
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
export function createLotEntity(lotId: string, lotData: any): Lot {
  return {
    id: lotId,
    driveway_condition: lotData.driveway_condition || undefined,
    driveway_material: lotData.driveway_material || undefined,
    fence_height: lotData.fence_height || undefined,
    fence_length: lotData.fence_length || undefined,
    fencing_type: lotData.fencing_type || undefined,
    landscaping_features: lotData.landscaping_features || undefined,
    lot_area_sqft: lotData.lot_area_sqft || undefined,
    lot_condition_issues: lotData.lot_condition_issues || undefined,
    lot_length_feet: lotData.lot_length_feet || undefined,
    lot_size_acre: lotData.lot_size_acre || undefined,
    lot_type: lotData.lot_type || undefined,
    lot_width_feet: lotData.lot_width_feet || undefined,
    request_identifier: lotData.request_identifier || undefined,
    view: lotData.view || undefined
  };
}

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

// Helper to create Utility entity
export function createUtilityEntity(utilityId: string, utilityData: any, layoutId?: string): Utility {
  return {
    id: utilityId,
    cooling_system_type: utilityData.cooling_system_type || undefined,
    electrical_panel_capacity: utilityData.electrical_panel_capacity || undefined,
    electrical_wiring_type: utilityData.electrical_wiring_type || undefined,
    electrical_wiring_type_other_description: utilityData.electrical_wiring_type_other_description || undefined,
    heating_system_type: utilityData.heating_system_type || undefined,
    hvac_condensing_unit_present: utilityData.hvac_condensing_unit_present || undefined,
    hvac_unit_condition: utilityData.hvac_unit_condition || undefined,
    hvac_unit_issues: utilityData.hvac_unit_issues || undefined,
    plumbing_system_type: utilityData.plumbing_system_type || undefined,
    plumbing_system_type_other_description: utilityData.plumbing_system_type_other_description || undefined,
    public_utility_type: utilityData.public_utility_type || undefined,
    request_identifier: utilityData.request_identifier || undefined,
    sewer_type: utilityData.sewer_type || undefined,
    smart_home_features: utilityData.smart_home_features || undefined,
    smart_home_features_other_description: utilityData.smart_home_features_other_description || undefined,
    solar_inverter_visible: utilityData.solar_inverter_visible || undefined,
    solar_panel_present: utilityData.solar_panel_present || undefined,
    solar_panel_type: utilityData.solar_panel_type || undefined,
    solar_panel_type_other_description: utilityData.solar_panel_type_other_description || undefined,
    water_source_type: utilityData.water_source_type || undefined,
    electrical_panel_installation_date: utilityData.electrical_panel_installation_date || undefined,
    electrical_rewire_date: utilityData.electrical_rewire_date || undefined,
    heating_fuel_type: utilityData.heating_fuel_type || undefined,
    hvac_capacity_kw: utilityData.hvac_capacity_kw || undefined,
    hvac_capacity_tons: utilityData.hvac_capacity_tons || undefined,
    hvac_equipment_component: utilityData.hvac_equipment_component || undefined,
    hvac_equipment_manufacturer: utilityData.hvac_equipment_manufacturer || undefined,
    hvac_equipment_model: utilityData.hvac_equipment_model || undefined,
    hvac_installation_date: utilityData.hvac_installation_date || undefined,
    hvac_seer_rating: utilityData.hvac_seer_rating || undefined,
    hvac_system_configuration: utilityData.hvac_system_configuration || undefined,
    plumbing_system_installation_date: utilityData.plumbing_system_installation_date || undefined,
    sewer_connection_date: utilityData.sewer_connection_date || undefined,
    solar_installation_date: utilityData.solar_installation_date || undefined,
    solar_inverter_installation_date: utilityData.solar_inverter_installation_date || undefined,
    solar_inverter_manufacturer: utilityData.solar_inverter_manufacturer || undefined,
    solar_inverter_model: utilityData.solar_inverter_model || undefined,
    water_connection_date: utilityData.water_connection_date || undefined,
    water_heater_installation_date: utilityData.water_heater_installation_date || undefined,
    water_heater_manufacturer: utilityData.water_heater_manufacturer || undefined,
    water_heater_model: utilityData.water_heater_model || undefined,
    well_installation_date: utilityData.well_installation_date || undefined,
    layout_id: layoutId || undefined
  };
}

// Helper to create FloodStormInformation entity
export function createFloodStormEntity(floodStormId: string, floodStormData: any): FloodStormInformation {
  return {
    id: floodStormId,
    community_id: floodStormData.community_id || undefined,
    effective_date: floodStormData.effective_date || undefined,
    evacuation_zone: floodStormData.evacuation_zone || undefined,
    fema_search_url: floodStormData.fema_search_url || undefined,
    flood_insurance_required: floodStormData.flood_insurance_required || undefined,
    flood_zone: floodStormData.flood_zone || undefined,
    map_version: floodStormData.map_version || undefined,
    panel_number: floodStormData.panel_number || undefined,
    request_identifier: floodStormData.request_identifier || undefined
  };
}

// Helper to create Person entity
export function createPersonEntity(personId: string, personData: any, propertyId: string, mailingAddressId?: string): Person {
  return {
    id: personId,
    birth_date: personData.birth_date || undefined,
    first_name: personData.first_name,
    last_name: personData.last_name,
    middle_name: personData.middle_name || undefined,
    prefix_name: personData.prefix_name || undefined,
    request_identifier: personData.request_identifier || undefined,
    suffix_name: personData.suffix_name || undefined,
    us_citizenship_status: personData.us_citizenship_status || undefined,
    veteran_status: personData.veteran_status || undefined,
    property_id: propertyId,
    mailing_address_id: mailingAddressId || undefined
  };
}

// Helper to create Company entity
export function createCompanyEntity(companyId: string, companyData: any, propertyId: string, mailingAddressId?: string): Company {
  return {
    id: companyId,
    name: companyData.name || undefined,
    request_identifier: companyData.request_identifier || undefined,
    property_id: propertyId,
    mailing_address_id: mailingAddressId || undefined
  };
}

//Helper to create Layout entity
export function createLayoutEntity(layoutId: string, layoutData: any, propertyId: string): Layout {
  return {
    id: layoutId,
    cabinet_style: layoutData.cabinet_style || undefined,
    clutter_level: layoutData.clutter_level || undefined,
    condition_issues: layoutData.condition_issues || undefined,
    countertop_material: layoutData.countertop_material || undefined,
    decor_elements: layoutData.decor_elements || undefined,
    design_style: layoutData.design_style || undefined,
    fixture_finish_quality: layoutData.fixture_finish_quality || undefined,
    floor_level: layoutData.floor_level || undefined,
    flooring_material_type: layoutData.flooring_material_type || undefined,
    flooring_wear: layoutData.flooring_wear || undefined,
    furnished: layoutData.furnished || undefined,
    has_windows: layoutData.has_windows || undefined,
    is_exterior: layoutData.is_exterior !== undefined ? layoutData.is_exterior : false,
    is_finished: layoutData.is_finished !== undefined ? layoutData.is_finished : false,
    lighting_features: layoutData.lighting_features || undefined,
    natural_light_quality: layoutData.natural_light_quality || undefined,
    paint_condition: layoutData.paint_condition || undefined,
    pool_condition: layoutData.pool_condition || undefined,
    pool_equipment: layoutData.pool_equipment || undefined,
    pool_surface_type: layoutData.pool_surface_type || undefined,
    pool_type: layoutData.pool_type || undefined,
    pool_water_quality: layoutData.pool_water_quality || undefined,
    request_identifier: layoutData.request_identifier || undefined,
    safety_features: layoutData.safety_features || undefined,
    size_square_feet: layoutData.size_square_feet || undefined,
    spa_type: layoutData.spa_type || undefined,
    space_index: layoutData.space_index !== undefined ? layoutData.space_index : 0,
    space_type: layoutData.space_type || undefined,
    view_type: layoutData.view_type || undefined,
    visible_damage: layoutData.visible_damage || undefined,
    window_design_type: layoutData.window_design_type || undefined,
    window_material_type: layoutData.window_material_type || undefined,
    window_treatment_type: layoutData.window_treatment_type || undefined,
    property_id: propertyId,
    adjustable_area_sq_ft: layoutData.adjustable_area_sq_ft || undefined,
    area_under_air_sq_ft: layoutData.area_under_air_sq_ft || undefined,
    bathroom_renovation_date: layoutData.bathroom_renovation_date || undefined,
    building_number: layoutData.building_number || undefined,
    flooring_installation_date: layoutData.flooring_installation_date || undefined,
    heated_area_sq_ft: layoutData.heated_area_sq_ft || undefined,
    kitchen_renovation_date: layoutData.kitchen_renovation_date || undefined,
    livable_area_sq_ft: layoutData.livable_area_sq_ft || undefined,
    pool_installation_date: layoutData.pool_installation_date || undefined,
    spa_installation_date: layoutData.spa_installation_date || undefined,
    story_type: layoutData.story_type || undefined,
    total_area_sq_ft: layoutData.total_area_sq_ft || undefined
  };
}

//Helper to create File entity
export function createFileEntity(fileId: string, fileData: any, propertyId: string, deedId?: string): File {
  return {
    id: fileId,
    document_type: fileData.document_type || undefined,
    file_format: fileData.file_format || undefined,
    ipfs_url: fileData.ipfs_url || undefined,
    name: fileData.name || undefined,
    original_url: fileData.original_url || undefined,
    request_identifier: fileData.request_identifier || undefined,
    property_id: propertyId,
    deed_id: deedId || undefined
  };
}

//Helper to create Deed entity
export function createDeedEntity(deedId: string, deedData: any, salesHistoryId?: string): Deed {
  return {
    id: deedId,
    deed_type: deedData.deed_type || undefined,
    sales_history_id: salesHistoryId || undefined
  };
}

// Helper to process County data with full parallelism
export async function processCountyData(context: any, metadata: any, cid: string, propertyEntityId: string) {
  // Initialize entity IDs that will be populated from IPFS data
  let addressId: string | undefined;
  let propertyDataId: string | undefined;
  let ipfsId: string | undefined;
  let lotId: string | undefined;
  let floodStormId: string | undefined;
  let parcelIdentifier: string | undefined;
  const salesHistoryEntities: SalesHistory[] = [];
  const taxEntities: Tax[] = [];
  const personEntities: Person[] = [];
  const companyEntities: Company[] = [];
  const layoutEntities: Layout[] = [];
  const fileEntities: File[] = [];
  const deedEntities: Deed[] = [];

  // First fetch relationships to get CIDs
  const relationshipPromises = [];

  const propertyAddressCid = metadata.relationships?.property_has_address?.["/"];
  const propertyLotCid = metadata.relationships?.property_has_lot?.["/"];
  const propertyFloodStormCid = metadata.relationships?.property_has_flood_storm_information?.["/"];
  const addressFactSheetCid = metadata.relationships?.address_has_fact_sheet?.[0]?.["/"];
  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];
  const personCids = metadata.relationships?.person_has_property || [];
  const companyCids = metadata.relationships?.company_has_property || [];
  const layoutCids = metadata.relationships?.property_has_layout || [];
  const fileCids = metadata.relationships?.property_has_file || [];
  const deedCids = metadata.relationships?.deed_has_file || [];
  const salesHistoryDeedCids = metadata.relationships?.sales_history_has_deed || [];
  const personMailingAddressCids = metadata.relationships?.person_has_mailing_address || [];
  const companyMailingAddressCids = metadata.relationships?.company_has_mailing_address || [];

  if (propertyAddressCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyAddressCid)
        .then((data: any) => ({ type: 'property_rel', data, cid: propertyAddressCid }))
        .catch((error: any) => ({ type: 'property_rel', error, cid: propertyAddressCid }))
    );
  }

  if (propertyLotCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyLotCid)
        .then((data: any) => ({ type: 'lot_rel', data, cid: propertyLotCid }))
        .catch((error: any) => ({ type: 'lot_rel', error, cid: propertyLotCid }))
    );
  }

  if (propertyFloodStormCid) {
    relationshipPromises.push(
      context.effect(getRelationshipData, propertyFloodStormCid)
        .then((data: any) => ({ type: 'flood_storm_rel', data, cid: propertyFloodStormCid }))
        .catch((error: any) => ({ type: 'flood_storm_rel', error, cid: propertyFloodStormCid }))
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

  // Add person relationship fetching
  for (const personRef of personCids) {
    const personRelCid = personRef?.["/"];
    if (personRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, personRelCid)
          .then((data: any) => ({ type: 'person_rel', data, cid: personRelCid }))
          .catch((error: any) => ({ type: 'person_rel', error, cid: personRelCid }))
      );
    }
  }

  // Add company relationship fetching
  for (const companyRef of companyCids) {
    const companyRelCid = companyRef?.["/"];
    if (companyRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, companyRelCid)
          .then((data: any) => ({ type: 'company_rel', data, cid: companyRelCid }))
          .catch((error: any) => ({ type: 'company_rel', error, cid: companyRelCid }))
      );
    }
  }

  // Add layout relationship fetching
  for (const layoutRef of layoutCids) {
    const layoutRelCid = layoutRef?.["/"];
    if (layoutRelCid) {
      relationshipPromises.push(
        context.effect(getRelationshipData, layoutRelCid)
          .then((data: any) => ({ type: 'layout_rel', data, cid: layoutRelCid }))
          .catch((error: any) => ({ type: 'layout_rel', error, cid: layoutRelCid }))
      );
    }
  }

  // Add file relationship fetching
  for (const fileRef of fileCids) {
    const fileRelCid = fileRef?.["/"];
    if (fileRelCid) {
        relationshipPromises.push(
        context.effect(getRelationshipData, fileRelCid)
            .then((data: any) => ({ type: 'file_rel', data, cid: fileRelCid }))
            .catch((error: any) => ({ type: 'file_rel', error, cid: fileRelCid }))
        );
    }
  }

  // Add deed relationship fetching
  for (const deedRef of deedCids) {
    const deedRelCid = deedRef?.["/"];
    if (deedRelCid) {
        relationshipPromises.push(
        context.effect(getRelationshipData, deedRelCid)
            .then((data: any) => ({ type: 'deed_rel', data, cid: deedRelCid }))
            .catch((error: any) => ({ type: 'deed_rel', error, cid: deedRelCid }))
        );
    }
  }

  // Add sales_history_has_deed relationship fetching
  for (const salesHistoryDeedRef of salesHistoryDeedCids) {
    const salesHistoryDeedRelCid = salesHistoryDeedRef?.["/"];
    if (salesHistoryDeedRelCid) {
        relationshipPromises.push(
        context.effect(getRelationshipData, salesHistoryDeedRelCid)
            .then((data: any) => ({ type: 'sales_history_deed_rel', data, cid: salesHistoryDeedRelCid }))
            .catch((error: any) => ({ type: 'sales_history_deed_rel', error, cid: salesHistoryDeedRelCid }))
        );
    }
  }

  // Add person_has_mailing_address relationship fetching
  for (const personMailingAddressRef of personMailingAddressCids) {
    const personMailingAddressRelCid = personMailingAddressRef?.["/"];
    if (personMailingAddressRelCid) {
        relationshipPromises.push(
        context.effect(getRelationshipData, personMailingAddressRelCid)
            .then((data: any) => ({ type: 'person_mailing_address_rel', data, cid: personMailingAddressRelCid }))
            .catch((error: any) => ({ type: 'person_mailing_address_rel', error, cid: personMailingAddressRelCid }))
        );
    }
  }

  // Add company_has_mailing_address relationship fetching
  for (const companyMailingAddressRef of companyMailingAddressCids) {
    const companyMailingAddressRelCid = companyMailingAddressRef?.["/"];
    if (companyMailingAddressRelCid) {
        relationshipPromises.push(
        context.effect(getRelationshipData, companyMailingAddressRelCid)
            .then((data: any) => ({ type: 'company_mailing_address_rel', data, cid: companyMailingAddressRelCid }))
            .catch((error: any) => ({ type: 'company_mailing_address_rel', error, cid: companyMailingAddressRelCid }))
        );
    }
  }

  const relationshipResults = await Promise.all(relationshipPromises);

  // Extract all CIDs for parallel fetching
  const allDataPromises = [];
  let propertyDataCid: string | undefined;
  let lotDataCid: string | undefined;
  let floodStormDataCid: string | undefined;
  let addressDataCid: string | undefined;
  let ipfsDataCid: string | undefined;

  for (const relationshipResult of relationshipResults) {
    if (relationshipResult.type === 'property_rel' && !relationshipResult.error) {
      // From property_has_address: get property (from)
      propertyDataCid = relationshipResult.data.from?.["/"];
    } else if (relationshipResult.type === 'lot_rel' && !relationshipResult.error) {
      // From property_has_lot: get lot data (to)
      lotDataCid = relationshipResult.data.to?.["/"];
    } else if (relationshipResult.type === 'flood_storm_rel' && !relationshipResult.error) {
      // From property_has_flood_storm_information: get flood storm data (to)
      floodStormDataCid = relationshipResult.data.to?.["/"];
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
    } else if (relationshipResult.type === 'person_rel' && !relationshipResult.error) {
      // From person_has_property: get person data (from)
      const targetCid = relationshipResult.data.from?.["/"];
      if (targetCid) {
        allDataPromises.push(
          context.effect(getPersonData, targetCid)
            .then((data: any) => ({ type: 'person', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'person', error, cid: targetCid }))
        );
      }
    } else if (relationshipResult.type === 'company_rel' && !relationshipResult.error) {
      // From company_has_property: get company data (from)
      const targetCid = relationshipResult.data.from?.["/"];
      if (targetCid) {
        allDataPromises.push(
          context.effect(getCompanyData, targetCid)
            .then((data: any) => ({ type: 'company', data, cid: targetCid }))
            .catch((error: any) => ({ type: 'company', error, cid: targetCid }))
        );
      }
    } else if (relationshipResult.type === 'layout_rel' && !relationshipResult.error) {
      // From property_has_layout: get layout metadata and data (to)
      const targetCid = relationshipResult.data.to?.["/"];
      if (targetCid) {
          // Fetch layout metadata to get structure and utility relationships
          allDataPromises.push(
          context.effect(getLayoutMetadata, targetCid)
              .then((metadata: any) => ({ type: 'layout_metadata', metadata, cid: targetCid }))
              .catch((error: any) => ({ type: 'layout_metadata', error, cid: targetCid }))
          );
          // Fetch layout data
          allDataPromises.push(
          context.effect(getLayoutData, targetCid)
              .then((data: any) => ({ type: 'layout', data, cid: targetCid }))
              .catch((error: any) => ({ type: 'layout', error, cid: targetCid }))
          );
      }
    } else if (relationshipResult.type === 'file_rel' && !relationshipResult.error) {
      // From property_has_file: get file data (to)
      const targetCid = relationshipResult.data.to?.["/"];
      if (targetCid) {
          allDataPromises.push(
          context.effect(getFileData, targetCid)
              .then((data: any) => ({ type: 'file', data, cid: targetCid }))
              .catch((error: any) => ({ type: 'file', error, cid: targetCid }))
          );
      }
    } else if (relationshipResult.type === 'deed_rel' && !relationshipResult.error) {
      const targetCid = relationshipResult.data.from?.["/"];
      if (targetCid) {
          allDataPromises.push(
          context.effect(getDeedData, targetCid)
              .then((data: any) => ({ type: 'deed', data, cid: targetCid }))
              .catch((error: any) => ({ type: 'deed', error, cid: targetCid }))
          );
      }
    } else if (relationshipResult.type === 'sales_history_deed_rel' && !relationshipResult.error) {
      // From sales_history_has_deed: get deed data (to) and sales history (from)
      const deedCid = relationshipResult.data.to?.["/"];
      const salesHistoryCid = relationshipResult.data.from?.["/"];
      if (deedCid) {
          allDataPromises.push(
          context.effect(getDeedData, deedCid)
              .then((data: any) => ({ type: 'sales_history_deed', data, cid: deedCid, salesHistoryCid }))
              .catch((error: any) => ({ type: 'sales_history_deed', error, cid: deedCid, salesHistoryCid }))
          );
      }
    } else if (relationshipResult.type === 'person_mailing_address_rel' && !relationshipResult.error) {
      // From person_has_mailing_address: get mailing address data (to) and person (from)
      const mailingAddressCid = relationshipResult.data.to?.["/"];
      const personCid = relationshipResult.data.from?.["/"];
      if (mailingAddressCid) {
          allDataPromises.push(
          context.effect(getMailingAddressData, mailingAddressCid)
              .then((data: any) => ({ type: 'person_mailing_address', data, cid: mailingAddressCid, personCid }))
              .catch((error: any) => ({ type: 'person_mailing_address', error, cid: mailingAddressCid, personCid }))
          );
      }
    } else if (relationshipResult.type === 'company_mailing_address_rel' && !relationshipResult.error) {
      // From company_has_mailing_address: get mailing address data (to) and company (from)
      const mailingAddressCid = relationshipResult.data.to?.["/"];
      const companyCid = relationshipResult.data.from?.["/"];
      if (mailingAddressCid) {
          allDataPromises.push(
          context.effect(getMailingAddressData, mailingAddressCid)
              .then((data: any) => ({ type: 'company_mailing_address', data, cid: mailingAddressCid, companyCid }))
              .catch((error: any) => ({ type: 'company_mailing_address', error, cid: mailingAddressCid, companyCid }))
          );
      }
    }
  }

  // Fetch all data in parallel
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

  if (lotDataCid) {
    allDataPromises.push(
      context.effect(getLotData, lotDataCid)
        .then((data: any) => ({ type: 'lot', data, cid: lotDataCid }))
        .catch((error: any) => ({ type: 'lot', error, cid: lotDataCid }))
    );
  }

  if (floodStormDataCid) {
    allDataPromises.push(
      context.effect(getFloodStormData, floodStormDataCid)
        .then((data: any) => ({ type: 'flood_storm', data, cid: floodStormDataCid }))
        .catch((error: any) => ({ type: 'flood_storm', error, cid: floodStormDataCid }))
    );
  }

  // Execute all data fetches in parallel
  const allDataResults = await Promise.all(allDataPromises);

  // First pass: process layout_metadata results and fetch structure/utility for each layout
  const layoutStructureUtilityPromises = [];
  const layoutMetadataMap = new Map(); // Map from layout CID to its metadata

  for (const result of allDataResults) {
    if (result.type === 'layout_metadata' && !result.error) {
      layoutMetadataMap.set(result.cid, result.metadata);

      // Get structure and utility relationship CIDs from layout metadata (all are arrays)
      const structureRelCids = result.metadata?.relationships?.layout_has_Structure || [];
      const utilityRelCids = result.metadata?.relationships?.layout_has_utility || [];

      // Fetch all structure relationships and data
      for (const structureRel of structureRelCids) {
        const structureRelCid = structureRel?.["/"];
        if (structureRelCid) {
          layoutStructureUtilityPromises.push(
            context.effect(getRelationshipData, structureRelCid)
              .then((relData: any) => {
                const structureCid = relData.to?.["/"];
                if (structureCid) {
                  return context.effect(getStructureData, structureCid)
                    .then((structureData: any) => ({
                      type: 'layout_structure',
                      layoutCid: result.cid,
                      structureCid,
                      structureData
                    }));
                }
                return null;
              })
              .catch((error: any) => ({ type: 'layout_structure', error, layoutCid: result.cid }))
          );
        }
      }

      // Fetch all utility relationships and data
      for (const utilityRel of utilityRelCids) {
        const utilityRelCid = utilityRel?.["/"];
        if (utilityRelCid) {
          layoutStructureUtilityPromises.push(
            context.effect(getRelationshipData, utilityRelCid)
              .then((relData: any) => {
                const utilityCid = relData.to?.["/"];
                if (utilityCid) {
                  return context.effect(getUtilityData, utilityCid)
                    .then((utilityData: any) => ({
                      type: 'layout_utility',
                      layoutCid: result.cid,
                      utilityCid,
                      utilityData
                    }));
                }
                return null;
              })
              .catch((error: any) => ({ type: 'layout_utility', error, layoutCid: result.cid }))
          );
        }
      }
    }
  }

  // Wait for all layout structure/utility fetches
  const layoutStructureUtilityResults = await Promise.all(layoutStructureUtilityPromises);

  // Process layout structure/utility results
  for (const result of layoutStructureUtilityResults) {
    if (!result || result.error) {
      if (result?.error) {
        context.log.warn(`Failed to fetch ${result.type} for layout`, {
          cid,
          layoutCid: result.layoutCid || result.parentLayoutCid,
          error: result.error.message
        });
      }
      continue;
    }

    if (result.type === 'layout_structure') {
      // Create structure entity with layout_id
      const structureEntity = createStructureEntity(result.structureCid, result.structureData, result.layoutCid);
      context.Structure.set(structureEntity);
    } else if (result.type === 'layout_utility') {
      // Create utility entity with layout_id
      const utilityEntity = createUtilityEntity(result.utilityCid, result.utilityData, result.layoutCid);
      context.Utility.set(utilityEntity);
    }
  }

  // Create maps to track mailing address IDs for persons and companies
  const personMailingAddressMap = new Map<string, string>();
  const companyMailingAddressMap = new Map<string, string>();

  // First pass: process mailing addresses and create MailingAddress entities
  for (const result of allDataResults) {
    if (result.error) {
      continue;
    }

    if (result.type === 'person_mailing_address') {
      // Create mailing address entity
      const mailingAddressEntity = createMailingAddressEntity(result.cid, result.data);
      context.MailingAddress.set(mailingAddressEntity);
      // Map person CID to mailing address ID
      personMailingAddressMap.set(result.personCid, result.cid);
    } else if (result.type === 'company_mailing_address') {
      // Create mailing address entity
      const mailingAddressEntity = createMailingAddressEntity(result.cid, result.data);
      context.MailingAddress.set(mailingAddressEntity);
      // Map company CID to mailing address ID
      companyMailingAddressMap.set(result.companyCid, result.cid);
    }
  }

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

    } else if (result.type === 'lot') {
      lotId = result.cid;
      const lotEntity = createLotEntity(result.cid, result.data);
      context.Lot.set(lotEntity);

    } else if (result.type === 'sales_history') {
      const salesHistoryEntity = createSalesHistoryEntity(result.cid, result.data, propertyEntityId);
      context.SalesHistory.set(salesHistoryEntity);
      salesHistoryEntities.push(salesHistoryEntity);

    } else if (result.type === 'tax') {
      const taxEntity = createTaxEntity(result.cid, result.data, propertyEntityId);
      context.Tax.set(taxEntity);
      taxEntities.push(taxEntity);

    } else if (result.type === 'flood_storm') {
      floodStormId = result.cid;
      const floodStormEntity = createFloodStormEntity(result.cid, result.data);
      context.FloodStormInformation.set(floodStormEntity);

    } else if (result.type === 'person') {
      const mailingAddressId = personMailingAddressMap.get(result.cid);
      const personEntity = createPersonEntity(result.cid, result.data, propertyEntityId, mailingAddressId);
      context.Person.set(personEntity);
      personEntities.push(personEntity);

    } else if (result.type === 'company') {
      const mailingAddressId = companyMailingAddressMap.get(result.cid);
      const companyEntity = createCompanyEntity(result.cid, result.data, propertyEntityId, mailingAddressId);
      context.Company.set(companyEntity);
      companyEntities.push(companyEntity);

    } else if (result.type === 'layout') {
      const layoutEntity = createLayoutEntity(result.cid, result.data, propertyEntityId);
      context.Layout.set(layoutEntity);
      layoutEntities.push(layoutEntity);
    } else if (result.type === 'layout_metadata') {
      // Skip - already processed above
      continue;
    } else if (result.type === 'person_mailing_address' || result.type === 'company_mailing_address') {
      // Skip - already processed above
      continue;
    } else if (result.type === 'file') {
      const fileEntity = createFileEntity(result.cid, result.data, propertyEntityId);
      context.File.set(fileEntity);
      fileEntities.push(fileEntity);
    } else if (result.type === 'deed') {
      const deedEntity = createDeedEntity(result.cid, result.data);
      context.Deed.set(deedEntity);
      deedEntities.push(deedEntity);
    } else if (result.type === 'sales_history_deed') {
      // Create deed entity linked to sales history
      const deedEntity = createDeedEntity(result.cid, result.data, result.salesHistoryCid);
      context.Deed.set(deedEntity);
      deedEntities.push(deedEntity);
    }
  }

  return {
    addressId,
    propertyDataId,
    ipfsId,
    lotId,
    floodStormId,
    parcelIdentifier,
    salesHistoryEntities,
    taxEntities,
    personEntities,
    companyEntities,
    layoutEntities,
    fileEntities,
    deedEntities
  };
}