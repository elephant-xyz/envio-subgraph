import {
  Address,
  Property,
  Ipfs,
  SalesHistory,
  Tax,
  Parcel,
  Geometry,
  Layout,
} from "generated";
import { dataTypeConfigs, getRelationshipData, getAddressData, getPropertyData, getIpfsFactSheetData, getSalesHistoryData, getTaxData, getParcelData, getGeometryData, getLayoutData } from "./ipfs";

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

// Helper to create Parcel entity
export function createParcelEntity(parcelId: string, parcelData: any, dataSubmissionId: string): Parcel {
  return {
    id: parcelId,
    parcel_identifier: parcelData.parcel_identifier,
    data_submission_id: dataSubmissionId
  };
}

// Helper to create Geometry entity
// Uses composite ID to prevent overwrites when same geometry is shared between parcel/address/layout
export function createGeometryEntity(
  geometryCid: string,
  geometryData: any,
  dataSubmissionId: string,
  parcelId?: string,
  addressId?: string,
  layoutId?: string
): Geometry {
  // Build composite ID based on parent type to allow same geometry for multiple parents
  let compositeId: string;
  if (parcelId) {
    compositeId = `${geometryCid}-parcel-${parcelId}`;
  } else if (addressId) {
    compositeId = `${geometryCid}-address-${addressId}`;
  } else if (layoutId) {
    compositeId = `${geometryCid}-layout-${layoutId}`;
  } else {
    compositeId = geometryCid; // Fallback to just CID if no parent
  }

  // Serialize polygon array to JSON string for GraphQL storage
  let polygonJson: string | undefined = undefined;
  if (geometryData.polygon && Array.isArray(geometryData.polygon)) {
    try {
      polygonJson = JSON.stringify(geometryData.polygon);
    } catch (error) {
      console.error('Failed to serialize polygon data:', error);
    }
  }

  return {
    id: compositeId,
    latitude: geometryData.latitude || undefined,
    longitude: geometryData.longitude || undefined,
    polygon: polygonJson,
    parcel_id: parcelId || undefined,
    address_id: addressId || undefined,
    layout_id: layoutId || undefined,
    data_submission_id: dataSubmissionId
  };
}

// Helper to create Layout entity
export function createLayoutEntity(layoutId: string, layoutData: any, dataSubmissionId: string): Layout {
  return {
    id: layoutId,
    space_type: layoutData.space_type || undefined,
    space_type_index: layoutData.space_type_index || undefined,
    space_index: layoutData.space_index,
    flooring_material_type: layoutData.flooring_material_type || undefined,
    size_square_feet: layoutData.size_square_feet || undefined,
    has_windows: layoutData.has_windows || undefined,
    window_design_type: layoutData.window_design_type || undefined,
    window_material_type: layoutData.window_material_type || undefined,
    window_treatment_type: layoutData.window_treatment_type || undefined,
    is_finished: layoutData.is_finished,
    is_exterior: layoutData.is_exterior,
    furnished: layoutData.furnished || undefined,
    paint_condition: layoutData.paint_condition || undefined,
    flooring_wear: layoutData.flooring_wear || undefined,
    clutter_level: layoutData.clutter_level || undefined,
    visible_damage: layoutData.visible_damage || undefined,
    countertop_material: layoutData.countertop_material || undefined,
    cabinet_style: layoutData.cabinet_style || undefined,
    fixture_finish_quality: layoutData.fixture_finish_quality || undefined,
    design_style: layoutData.design_style || undefined,
    natural_light_quality: layoutData.natural_light_quality || undefined,
    decor_elements: layoutData.decor_elements || undefined,
    pool_type: layoutData.pool_type || undefined,
    pool_equipment: layoutData.pool_equipment || undefined,
    spa_type: layoutData.spa_type || undefined,
    safety_features: layoutData.safety_features || undefined,
    view_type: layoutData.view_type || undefined,
    lighting_features: layoutData.lighting_features || undefined,
    condition_issues: layoutData.condition_issues || undefined,
    pool_condition: layoutData.pool_condition || undefined,
    pool_surface_type: layoutData.pool_surface_type || undefined,
    pool_water_quality: layoutData.pool_water_quality || undefined,
    floor_level: layoutData.floor_level || undefined,
    building_number: layoutData.building_number || undefined,
    built_year: layoutData.built_year || undefined,
    story_type: layoutData.story_type || undefined,
    livable_area_sq_ft: layoutData.livable_area_sq_ft || undefined,
    heated_area_sq_ft: layoutData.heated_area_sq_ft || undefined,
    total_area_sq_ft: layoutData.total_area_sq_ft || undefined,
    area_under_air_sq_ft: layoutData.area_under_air_sq_ft || undefined,
    adjustable_area_sq_ft: layoutData.adjustable_area_sq_ft || undefined,
    data_submission_id: dataSubmissionId
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

  // Use parcelIdentifier as data_submission_id for all entities if available
  const effectiveDataSubmissionId = parcelIdentifier || propertyEntityId;

  // PHASE 2: sales/tax relationships and data using final propertyId (parcel_identifier only)
  if (!parcelIdentifier) {
    context.log.info("Skipping Phase 2 (sales/tax) - no parcel_identifier resolved", { cid });
    return {
      addressId,
      propertyDataId,
      ipfsId,
      taxEntities,
      parcelIdentifier,
      salesHistoryEntities,
    };
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

  // PHASE 3: parcel_has_geometry relationships - process parcel and geometry entities
  const parcelGeometryRaw = metadata.relationships?.parcel_has_geometry;
  const parcelGeometryCids = Array.isArray(parcelGeometryRaw)
    ? parcelGeometryRaw
    : (parcelGeometryRaw && typeof parcelGeometryRaw === 'object' ? [parcelGeometryRaw] : []);

  const phase3RelPromises: any[] = [];

  for (const geometryRef of parcelGeometryCids) {
    const geometryRelCid = geometryRef?.["/"];
    if (geometryRelCid) {
      phase3RelPromises.push(
        (async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getRelationshipData, geometryRelCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[parcel_geometry] geometry relationship fetched", { cid: geometryRelCid, gateway, durationMs });
            return { type: 'parcel_geometry_rel', data, cid: geometryRelCid, durationMs };
          } catch (error: any) {
            return { type: 'parcel_geometry_rel', error, cid: geometryRelCid };
          }
        })()
      );
    }
  }

  const phase3RelResults = await Promise.all(phase3RelPromises);

  const phase3DataPromises: any[] = [];
  for (const rel of phase3RelResults) {
    if (rel.error) continue;
    if (rel.type === 'parcel_geometry_rel') {
      const parcelDataCid = rel.data.from?.["/"];
      const geometryDataCid = rel.data.to?.["/"];

      // Fetch parcel data
      if (parcelDataCid) {
        phase3DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getParcelData, parcelDataCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[parcel_geometry] parcel data fetched", { cid: parcelDataCid, gateway, durationMs });
            return { type: 'parcel', data, cid: parcelDataCid, durationMs };
          } catch (error: any) {
            return { type: 'parcel', error, cid: parcelDataCid };
          }
        })());
      }

      // Fetch geometry data
      if (geometryDataCid) {
        phase3DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getGeometryData, geometryDataCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[parcel_geometry] geometry data fetched", { cid: geometryDataCid, gateway, durationMs });
            return { type: 'geometry', data, cid: geometryDataCid, durationMs, parcelCid: parcelDataCid };
          } catch (error: any) {
            return { type: 'geometry', error, cid: geometryDataCid };
          }
        })());
      }
    }
  }

  const phase3DataResults = await Promise.all(phase3DataPromises);
  for (const result of phase3DataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, { cid, error: result.error.message });
      continue;
    }
    if (result.type === 'parcel') {
      const parcelEntity = createParcelEntity(result.cid, result.data, effectiveDataSubmissionId);
      context.Parcel.set(parcelEntity);
    } else if (result.type === 'geometry') {
      const geometryEntity = createGeometryEntity(result.cid, result.data, effectiveDataSubmissionId, result.parcelCid);
      context.Geometry.set(geometryEntity);
    }
  }

  // PHASE 4: address_has_geometry relationships - process geometry entities linked to address
  const addressGeometryRaw = metadata.relationships?.address_has_geometry;
  const addressGeometryCids = Array.isArray(addressGeometryRaw)
    ? addressGeometryRaw
    : (addressGeometryRaw && typeof addressGeometryRaw === 'object' ? [addressGeometryRaw] : []);

  const phase4RelPromises: any[] = [];

  for (const geometryRef of addressGeometryCids) {
    const geometryRelCid = geometryRef?.["/"];
    if (geometryRelCid) {
      phase4RelPromises.push(
        (async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getRelationshipData, geometryRelCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[address_geometry] geometry relationship fetched", { cid: geometryRelCid, gateway, durationMs });
            return { type: 'address_geometry_rel', data, cid: geometryRelCid, durationMs };
          } catch (error: any) {
            return { type: 'address_geometry_rel', error, cid: geometryRelCid };
          }
        })()
      );
    }
  }

  const phase4RelResults = await Promise.all(phase4RelPromises);

  const phase4DataPromises: any[] = [];
  for (const rel of phase4RelResults) {
    if (rel.error) continue;
    if (rel.type === 'address_geometry_rel') {
      const addressDataCidFromRel = rel.data.from?.["/"];
      const geometryDataCid = rel.data.to?.["/"];

      // Fetch geometry data linked to address
      if (geometryDataCid) {
        phase4DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getGeometryData, geometryDataCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[address_geometry] geometry data fetched", { cid: geometryDataCid, gateway, durationMs });
            return { type: 'address_geometry', data, cid: geometryDataCid, durationMs, addressCid: addressDataCidFromRel };
          } catch (error: any) {
            return { type: 'address_geometry', error, cid: geometryDataCid };
          }
        })());
      }
    }
  }

  const phase4DataResults = await Promise.all(phase4DataPromises);
  for (const result of phase4DataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, { cid, error: result.error.message });
      continue;
    }
    if (result.type === 'address_geometry') {
      const geometryEntity = createGeometryEntity(result.cid, result.data, effectiveDataSubmissionId, undefined, result.addressCid);
      context.Geometry.set(geometryEntity);
    }
  }

  // PHASE 5: layout_has_geometry relationships - process layout and geometry entities
  const layoutGeometryRaw = metadata.relationships?.layout_has_geometry;
  const layoutGeometryCids = Array.isArray(layoutGeometryRaw)
    ? layoutGeometryRaw
    : (layoutGeometryRaw && typeof layoutGeometryRaw === 'object' ? [layoutGeometryRaw] : []);

  const phase5RelPromises: any[] = [];

  for (const geometryRef of layoutGeometryCids) {
    const geometryRelCid = geometryRef?.["/"];
    if (geometryRelCid) {
      phase5RelPromises.push(
        (async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getRelationshipData, geometryRelCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[layout_geometry] geometry relationship fetched", { cid: geometryRelCid, gateway, durationMs });
            return { type: 'layout_geometry_rel', data, cid: geometryRelCid, durationMs };
          } catch (error: any) {
            return { type: 'layout_geometry_rel', error, cid: geometryRelCid };
          }
        })()
      );
    }
  }

  const phase5RelResults = await Promise.all(phase5RelPromises);

  const phase5DataPromises: any[] = [];
  for (const rel of phase5RelResults) {
    if (rel.error) continue;
    if (rel.type === 'layout_geometry_rel') {
      const layoutDataCid = rel.data.from?.["/"];
      const geometryDataCid = rel.data.to?.["/"];

      // Fetch layout data
      if (layoutDataCid) {
        phase5DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getLayoutData, layoutDataCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[layout_geometry] layout data fetched", { cid: layoutDataCid, gateway, durationMs });
            return { type: 'layout', data, cid: layoutDataCid, durationMs };
          } catch (error: any) {
            return { type: 'layout', error, cid: layoutDataCid };
          }
        })());
      }

      // Fetch geometry data
      if (geometryDataCid) {
        phase5DataPromises.push((async () => {
          const start = Date.now();
          try {
            const data = await context.effect(getGeometryData, geometryDataCid);
            const durationMs = Date.now() - start;
            const gateway = dataTypeConfigs.property?.gateway;
            context.log.info("IPFS phase[layout_geometry] geometry data fetched", { cid: geometryDataCid, gateway, durationMs });
            return { type: 'layout_geometry', data, cid: geometryDataCid, durationMs, layoutCid: layoutDataCid };
          } catch (error: any) {
            return { type: 'layout_geometry', error, cid: geometryDataCid };
          }
        })());
      }
    }
  }

  const phase5DataResults = await Promise.all(phase5DataPromises);
  for (const result of phase5DataResults) {
    if (result.error) {
      context.log.warn(`Failed to fetch ${result.type} data`, { cid, error: result.error.message });
      continue;
    }
    if (result.type === 'layout') {
      const layoutEntity = createLayoutEntity(result.cid, result.data, effectiveDataSubmissionId);
      context.Layout.set(layoutEntity);
    } else if (result.type === 'layout_geometry') {
      const geometryEntity = createGeometryEntity(result.cid, result.data, effectiveDataSubmissionId, undefined, undefined, result.layoutCid);
      context.Geometry.set(geometryEntity);
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