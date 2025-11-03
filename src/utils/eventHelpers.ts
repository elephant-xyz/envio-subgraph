import {
  Address,
  Property,
  Ipfs,
  SalesHistory,
  Tax,
  Structure,
  Utility,
  Layout,
  Lot,
  Improvement,
  Inspection,
  File,
  Company,
  Person,
} from "generated";
import { dataTypeConfigs, enableImprovements, getRelationshipData, getAddressData, getPropertyData, getIpfsFactSheetData, getSalesHistoryData, getTaxData, getStructureData, getUtilityData, getLayoutData, getLotData, getImprovementData, getInspectionData, getFileData, getCompanyData, getPersonData, getIpfsMetadata } from "./ipfs";

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
export function createStructureEntity(id: string, data: any, propertyId: string): Structure {
  return {
    id,
    property_id: propertyId,
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
  };
}

// Helper to create Property entity
export function createPropertyEntity(propertyDataId: string, propertyData: any): Property {
  return {
    id: propertyDataId,
    property_type: propertyData.property_type || undefined,
    build_status: propertyData.build_status || undefined,
    property_structure_built_year: propertyData.property_structure_built_year || undefined,
    property_effective_built_year: propertyData.property_effective_built_year || undefined,
    parcel_identifier: propertyData.parcel_identifier || undefined,
    area_under_air: propertyData.area_under_air || undefined,
    historic_designation: propertyData.historic_designation || undefined,
    livable_floor_area: propertyData.livable_floor_area || undefined,
    number_of_units: propertyData.number_of_units || undefined,
    number_of_units_type: propertyData.number_of_units_type || undefined,
    ownership_estate_type: propertyData.ownership_estate_type || undefined,
    property_legal_description_text: propertyData.property_legal_description_text || undefined,
    property_usage_type: propertyData.property_usage_type || undefined,
    request_identifier: propertyData.request_identifier || undefined,
    structure_form: propertyData.structure_form || undefined,
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
    township: addressData.township || undefined,
    unnormalized_address: addressData.unnormalized_address || undefined
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

// Helper to create Utility entity
export function createUtilityEntity(id: string, data: any, propertyId: string): Utility {
  return {
    id,
    property_id: propertyId,
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
  };
}

// Helper to create Layout entity
export function createLayoutEntity(id: string, data: any, propertyId: string): Layout {
  return {
    id,
    property_id: propertyId,
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
    is_exterior: data.is_exterior,
    is_finished: data.is_finished,
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
    space_index: data.space_index,
    space_type: data.space_type || undefined,
    view_type: data.view_type || undefined,
    visible_damage: data.visible_damage || undefined,
    window_design_type: data.window_design_type || undefined,
    window_material_type: data.window_material_type || undefined,
    window_treatment_type: data.window_treatment_type || undefined,
  };
}

// Helper to create Lot entity
export function createLotEntity(id: string, data: any): Lot {
  return {
    id,
    request_identifier: data.request_identifier || undefined,
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

// Helper to create Improvement entity
export function createImprovementEntity(improvementId: string, improvementData: any, propertyId: string): Improvement {
  return {
    id: improvementId,
    improvement_type: improvementData.improvement_type || undefined,
    improvement_subtype: improvementData.improvement_subtype || undefined,
    description: improvementData.description || undefined,
    year_completed: improvementData.year_completed || undefined,
    cost_amount: improvementData.cost_amount || undefined,
    request_identifier: improvementData.request_identifier || undefined,
    property_id: propertyId,
    // Elephant detailed fields
    application_received_date: improvementData.application_received_date || undefined,
    completion_date: improvementData.completion_date || undefined,
    contractor_type: improvementData.contractor_type || undefined,
    final_inspection_date: improvementData.final_inspection_date || undefined,
    improvement_action: improvementData.improvement_action || undefined,
    improvement_status: improvementData.improvement_status || undefined,
    is_disaster_recovery: improvementData.is_disaster_recovery || undefined,
    is_owner_builder: improvementData.is_owner_builder || undefined,
    permit_close_date: improvementData.permit_close_date || undefined,
    permit_issue_date: improvementData.permit_issue_date || undefined,
    permit_number: improvementData.permit_number || undefined,
    permit_required: improvementData.permit_required || undefined,
    private_provider_inspections: improvementData.private_provider_inspections || undefined,
    private_provider_plan_review: improvementData.private_provider_plan_review || undefined,
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

// Helper to create Inspection entity
export function createInspectionEntity(id: string, data: any, propertyId: string): Inspection {
  return {
    id,
    completed_date: data.completed_date || undefined,
    completed_time: data.completed_time || undefined,
    inspection_number: data.inspection_number || undefined,
    inspection_status: data.inspection_status || undefined,
    permit_number: data.permit_number || undefined,
    requested_date: data.requested_date || undefined,
    scheduled_date: data.scheduled_date || undefined,
    property_id: propertyId,
  };
}

// Helper to create File entity
export function createFileEntity(id: string, data: any, propertyId: string): File {
  return {
    id,
    document_type: data.document_type || undefined,
    file_format: data.file_format || undefined,
    ipfs_url: data.ipfs_url || undefined,
    name: data.name || undefined,
    original_url: data.original_url || undefined,
    request_identifier: data.request_identifier || undefined,
    property_id: propertyId,
  };
}

// Helper to create Company entity
export function createCompanyEntity(id: string, data: any, propertyId: string): Company {
  return {
    id,
    name: data.name || undefined,
    request_identifier: data.request_identifier || undefined,
    property_id: propertyId,
  };
}

// Helper to create Person entity
export function createPersonEntity(id: string, data: any, propertyId: string): Person {
  return {
    id,
    first_name: data.first_name || undefined,
    last_name: data.last_name || undefined,
    birth_date: data.birth_date || undefined,
    prefix_name: data.prefix_name || undefined,
    suffix_name: data.suffix_name || undefined,
    us_citizenship_status: data.us_citizenship_status || undefined,
    veteran_status: data.veteran_status || undefined,
    property_id: propertyId,
  };
}

// Helper to process County data with full parallelism
export async function processCountyData(context: any, metadata: any, cid: string, propertyEntityId: string) {
  // Initialize entity IDs that will be populated from IPFS data
  let addressId: string | undefined;
  let propertyDataId: string | undefined;
  let ipfsId: string | undefined;
  let parcelIdentifier: string | undefined;
  const salesHistoryEntities: SalesHistory[] = [];
  const taxEntities: Tax[] = [];
  const improvementEntities: Improvement[] = [];
  let structurePend: any[] | undefined;
  let utilityPend: any[] | undefined;
  let layoutPend: any[] | undefined;

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
  let structureDataCid: string | undefined;
  let utilityDataCid: string | undefined;
  const layoutDataCids: string[] = [];
  const lotDataCids: string[] = [];

  for (const rel of phase1RelResults) {
    if (rel.error) continue;
    if (rel.type === 'property_rel') {
      propertyDataCid = rel.data.from?.["/"] || rel.data.to?.["/"];
      // Also derive addressDataCid from property_has_address (to = address)
      if (!addressDataCid) {
        addressDataCid = rel.data.to?.["/"];
      }
      // If improvement indexing is enabled, traverse all other property classes (ignore property/parcel)
      if (enableImprovements) {
        const rels = metadata.relationships || {};
        if (rels.property_has_structure?.["/"]) {
          structureDataCid = rels.property_has_structure?.["/"];
        }
        if (rels.property_has_utility?.["/"]) {
          utilityDataCid = rels.property_has_utility?.["/"];
        }
        if (Array.isArray(rels.property_has_layout)) {
          for (const ref of rels.property_has_layout) {
            const cidRef = ref?.["/"];
            if (cidRef) layoutDataCids.push(cidRef);
          }
        }
        if (Array.isArray(rels.property_has_lot)) {
          for (const ref of rels.property_has_lot) {
            const cidRef = ref?.["/"];
            if (cidRef) lotDataCids.push(cidRef);
          }
        }
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

  // Structure
  if (structureDataCid) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getStructureData, structureDataCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.property?.gateway;
        context.log.info("IPFS phase[property_address] structure data fetched", { cid: structureDataCid, gateway, durationMs });
        return { type: 'structure', data, cid: structureDataCid, durationMs };
      } catch (error: any) {
        return { type: 'structure', error, cid: structureDataCid };
      }
    })());
  }

  // Utility
  if (utilityDataCid) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getUtilityData, utilityDataCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.property?.gateway;
        context.log.info("IPFS phase[property_address] utility data fetched", { cid: utilityDataCid, gateway, durationMs });
        return { type: 'utility', data, cid: utilityDataCid, durationMs };
      } catch (error: any) {
        return { type: 'utility', error, cid: utilityDataCid };
      }
    })());
  }

  // Layouts
  for (const layoutCid of layoutDataCids) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getLayoutData, layoutCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.property?.gateway;
        context.log.info("IPFS phase[property_address] layout data fetched", { cid: layoutCid, gateway, durationMs });
        return { type: 'layout', data, cid: layoutCid, durationMs };
      } catch (error: any) {
        return { type: 'layout', error, cid: layoutCid };
      }
    })());
  }

  // Lots
  for (const lotCid of lotDataCids) {
    allDataPromises.push((async () => {
      const start = Date.now();
      try {
        const data = await context.effect(getLotData, lotCid);
        const durationMs = Date.now() - start;
        const gateway = dataTypeConfigs.property?.gateway;
        context.log.info("IPFS phase[property_address] lot data fetched", { cid: lotCid, gateway, durationMs });
        return { type: 'lot', data, cid: lotCid, durationMs };
      } catch (error: any) {
        return { type: 'lot', error, cid: lotCid };
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
    } else if (result.type === 'structure') {
      // Defer until parcelIdentifier is known
      (structurePend ||= []).push(result);
    } else if (result.type === 'utility') {
      (utilityPend ||= []).push(result);
    } else if (result.type === 'layout') {
      (layoutPend ||= []).push(result);
    } else if (result.type === 'lot') {
      const entity = createLotEntity(result.cid, result.data);
      context.Lot.set(entity);
    }
  }

  // Removed fallback to address.request_identifier to enforce parcel_id/parcel_identifier only

  // PHASE 2: sales/tax/improvement relationships and data using final propertyId (parcel_identifier only)
  if (!parcelIdentifier) {
    context.log.info("Skipping Phase 2 (sales/tax/improvement) - no parcel_identifier resolved", { cid });
    return {
      addressId,
      propertyDataId,
      ipfsId,
      taxEntities,
      parcelIdentifier,
      salesHistoryEntities,
      improvementEntities,
    };
  }

  const salesHistoryCids = metadata.relationships?.property_has_sales_history || [];
  const taxCids = metadata.relationships?.property_has_tax || [];
  const improvementCids = enableImprovements ? (metadata.relationships?.property_has_improvement || []) : [];

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

  // Improvements relationships (guarded by flag)
  if (enableImprovements) {
    for (const impRef of improvementCids) {
      const impRelCid = impRef?.["/"];
      if (impRelCid) {
        phase2RelPromises.push(
          (async () => {
            const start = Date.now();
            try {
              const data = await context.effect(getRelationshipData, impRelCid);
              const durationMs = Date.now() - start;
              const gateway = dataTypeConfigs.property?.gateway;
              context.log.info("IPFS phase[improvement] improvement relationship fetched", { cid: impRelCid, gateway, durationMs });
              return { type: 'improvement_rel', data, cid: impRelCid, durationMs };
            } catch (error: any) {
              return { type: 'improvement_rel', error, cid: impRelCid };
            }
          })()
        );
      }
    }
  }

  // Inspections relationships (treat similar to improvements)
  const inspectionCids = metadata.relationships?.property_has_inspection || [];
  for (const insRef of inspectionCids) {
    const insRelCid = insRef?.["/"];
    if (insRelCid) {
      phase2RelPromises.push(
        (async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getRelationshipData, insRelCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[inspection] inspection relationship fetched", { cid: insRelCid, gateway, durationMs });
            return { type: 'inspection_rel', data, cid: insRelCid, durationMs };
          } catch (error: any) {
            return { type: 'inspection_rel', error, cid: insRelCid };
          }
        })()
      );
    }
  }

  // Files relationships
  const fileCids = metadata.relationships?.property_has_file || [];
  for (const fileRef of fileCids) {
    const fileRelCid = fileRef?.["/"];
    if (fileRelCid) {
      phase2RelPromises.push(
        (async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getRelationshipData, fileRelCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[file] file relationship fetched", { cid: fileRelCid, gateway, durationMs });
            return { type: 'file_rel', data, cid: fileRelCid, durationMs };
          } catch (error: any) {
            return { type: 'file_rel', error, cid: fileRelCid };
          }
        })()
      );
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
    } else if (rel.type === 'improvement_rel' && enableImprovements) {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getImprovementData, targetCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[improvement] improvement data fetched", { cid: targetCid, gateway, durationMs });
            return { type: 'improvement', data, cid: targetCid, durationMs };
          } catch (error: any) {
            return { type: 'improvement', error, cid: targetCid };
          }
        })());
      }
    } else if (rel.type === 'inspection_rel') {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getInspectionData, targetCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[inspection] inspection data fetched", { cid: targetCid, gateway, durationMs });
            return { type: 'inspection', data, cid: targetCid, durationMs };
          } catch (error: any) {
            return { type: 'inspection', error, cid: targetCid };
          }
        })());
      }
    } else if (rel.type === 'file_rel') {
      const targetCid = rel.data.to?.["/"] || rel.data.from?.["/"];
      if (targetCid) {
        phase2DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getFileData, targetCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[file] file data fetched", { cid: targetCid, gateway, durationMs });
            return { type: 'file', data, cid: targetCid, durationMs };
          } catch (error: any) {
            return { type: 'file', error, cid: targetCid };
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
    } else if (result.type === 'improvement' && enableImprovements) {
      const improvementEntity = createImprovementEntity(result.cid, result.data, parcelIdentifier);
      context.Improvement.set(improvementEntity);
      improvementEntities.push(improvementEntity);

      // Traverse contractors and contractor personnel from improvement metadata
      try {
        const impMeta = await context.effect(getIpfsMetadata, result.cid);
        const rels: any = (impMeta as any)?.relationships || {};

        // Contractors
        const contractorRels = rels.property_improvement_has_contractor || [];
        for (const cref of contractorRels) {
          const cRelCid = cref?.["/"];
          if (!cRelCid) continue;
          try {
            const cr = await context.effect(getRelationshipData, cRelCid);
            const endpoints = [cr.to?.["/"], cr.from?.["/"]].filter(Boolean) as string[];
            for (const ep of endpoints) {
              try {
                const c = await context.effect(getCompanyData, ep);
                if (c && (c.name || c.request_identifier)) {
                  const companyEntity = createCompanyEntity(ep, c, parcelIdentifier);
                  context.Company.set(companyEntity);
                }
              } catch {}
            }
          } catch {}
        }

        // Contractor personnel
        const personRels = rels.contractor_has_person || [];
        for (const pref of personRels) {
          const pRelCid = pref?.["/"];
          if (!pRelCid) continue;
          try {
            const pr = await context.effect(getRelationshipData, pRelCid);
            const endpoints = [pr.to?.["/"], pr.from?.["/"]].filter(Boolean) as string[];
            for (const ep of endpoints) {
              try {
                const p = await context.effect(getPersonData, ep);
                if (p && (p.first_name || p.last_name || p.request_identifier)) {
                  const personEntity = createPersonEntity(ep, p, parcelIdentifier);
                  context.Person.set(personEntity);
                }
              } catch {}
            }
          } catch {}
        }
      } catch {}
    } else if (result.type === 'inspection') {
      const inspectionEntity = createInspectionEntity(result.cid, result.data, parcelIdentifier);
      context.Inspection.set(inspectionEntity);
    } else if (result.type === 'file') {
      const fileEntity = createFileEntity(result.cid, result.data, parcelIdentifier);
      context.File.set(fileEntity);
    }
  }

  // After parcelIdentifier known, flush pending structure/utility/layout
  if (parcelIdentifier) {
    if (structurePend) {
      for (const r of structurePend) {
        const entity = createStructureEntity(r.cid, r.data, parcelIdentifier);
        context.Structure.set(entity);
      }
    }
    if (utilityPend) {
      for (const r of utilityPend) {
        const entity = createUtilityEntity(r.cid, r.data, parcelIdentifier);
        context.Utility.set(entity);
      }
    }
    if (layoutPend) {
      for (const r of layoutPend) {
        const entity = createLayoutEntity(r.cid, r.data, parcelIdentifier);
        context.Layout.set(entity);
      }
    }
  }

  return {
    addressId,
    propertyDataId,
    ipfsId,
    taxEntities,
    parcelIdentifier,
    salesHistoryEntities,
    improvementEntities,
  }
  
    }