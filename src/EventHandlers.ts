/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ERC1967Proxy,
  ERC1967Proxy_DataGroupConsensusUpdated,
  ERC1967Proxy_DataGroupHeartBeat,
  ERC1967Proxy_DataSubmitted,
  ERC1967Proxy_Initialized,
  ERC1967Proxy_MinimumConsensusUpdated,
  ERC1967Proxy_RoleAdminChanged,
  ERC1967Proxy_RoleGranted,
  ERC1967Proxy_RoleRevoked,
  ERC1967Proxy_Upgraded,
  DataSubmittedWithLabel,
  Structure,
  Address,
  Property,
} from "generated";

import { bytes32ToCID, getIpfsMetadata, getRelationshipData, getStructureData, getAddressData, getPropertyData } from "./utils/ipfs";

ERC1967Proxy.DataGroupConsensusUpdated.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_DataGroupConsensusUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    dataGroupHash: event.params.dataGroupHash,
    oldValue: event.params.oldValue,
    newValue: event.params.newValue,
  };

  context.ERC1967Proxy_DataGroupConsensusUpdated.set(entity);


});

ERC1967Proxy.DataGroupHeartBeat.handler(async ({ event, context }) => {
  // Only process events from specific submitters
  const allowedSubmitters = [
    "0x2C810CD120eEb840a7012b77a2B4F19889Ecf65C"
  ];

  if (!allowedSubmitters.includes(event.params.submitter)) {
    context.log.info(`Skipping HeartBeat event - only processing events from specific submitters`, {
      submitter: event.params.submitter,
      propertyHash: event.params.propertyHash
    });
    return;
  }

  const entity: ERC1967Proxy_DataGroupHeartBeat = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    propertyHash: event.params.propertyHash,
    dataGroupHash: event.params.dataGroupHash,
    dataHash: event.params.dataHash,
    submitter: event.params.submitter,
  };

  context.ERC1967Proxy_DataGroupHeartBeat.set(entity);

  const cid = bytes32ToCID(event.params.dataHash);

  try {
    const metadata = await context.effect(getIpfsMetadata, cid);

    // Use propertyHash as the unique ID for the property
    const propertyId = event.params.propertyHash;
    let parcelIdentifier: string | undefined;

    // Initialize entity IDs that will be populated from IPFS data
    let structureId: string | undefined;
    let addressId: string | undefined;
    let propertyDataId: string | undefined;

    if (metadata.label === "County") {
      // Process structure data if available
      const structureCid = metadata.relationships?.property_has_structure?.["/"];
      if (structureCid) {
        try {
          const relationshipData = await context.effect(getRelationshipData, structureCid);

          // Fetch structure data from "to" part
          try {
            const structureDataCid = relationshipData.to["/"];
            const structureData = await context.effect(getStructureData, structureDataCid);

            structureId = structureDataCid; // Use the CID as the structure ID
            const structureEntity: Structure = {
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
              window_screen_material: structureData.window_screen_material || undefined
            };
            context.Structure.set(structureEntity);

            context.log.info(`Updated Structure entity from HeartBeat`, {
              structureId,
              roof_date: structureData.roof_date
            });
          } catch (structureError) {
            context.log.warn(`Failed to fetch STRUCTURE data from HeartBeat`, {
              cid,
              structureCid,
              structureDataCid: relationshipData.to?.["/"] || "missing",
              error: (structureError as Error).message
            });
          }

          // Fetch property data from "from" part if available
          if (relationshipData.from && relationshipData.from["/"]) {
            try {
              const propertyDataCid = relationshipData.from["/"];
              const propertyData = await context.effect(getPropertyData, propertyDataCid);

              propertyDataId = propertyDataCid; // Use the CID as the property ID
              const propertyEntity: Property = {
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
              context.Property.set(propertyEntity);

              // Use parcel_identifier as the main entity ID if available
              if (propertyData.parcel_identifier) {
                parcelIdentifier = propertyData.parcel_identifier;
              }

              context.log.info(`Updated Property entity from HeartBeat`, {
                propertyDataId,
                property_type: propertyData.property_type,
                property_structure_built_year: propertyData.property_structure_built_year,
                property_effective_built_year: propertyData.property_effective_built_year,
                parcel_identifier: propertyData.parcel_identifier
              });
            } catch (propertyError) {
              context.log.warn(`Failed to fetch PROPERTY data from HeartBeat`, {
                cid,
                structureCid,
                propertyDataCid: relationshipData.from["/"],
                error: (propertyError as Error).message
              });
            }
          }
        } catch (relationshipError) {
          context.log.warn(`Failed to fetch RELATIONSHIP data from HeartBeat`, {
            cid,
            structureCid,
            error: (relationshipError as Error).message
          });
        }
      }

      context.log.info(`Updated County property from HeartBeat`, {
        propertyId,
        label: metadata.label,
        structureId
      });
    } else if (metadata.label === "Seed") {
      // Skip Seed processing - only process County labels
      context.log.info(`Skipping Seed label processing from HeartBeat`, {
        propertyHash: event.params.propertyHash,
        label: metadata.label
      });
      return;
    }

    // Use parcel_identifier as the main entity ID, fallback to propertyHash
    const mainEntityId = parcelIdentifier || propertyId;
    const idSource = parcelIdentifier ? "parcel_identifier" : "propertyHash";

    // Check if entity exists (try parcel_identifier first, then propertyHash)
    let existingEntity: DataSubmittedWithLabel | undefined;
    if (parcelIdentifier) {
      existingEntity = await context.DataSubmittedWithLabel.get(parcelIdentifier);
    }
    if (!existingEntity) {
      existingEntity = await context.DataSubmittedWithLabel.get(propertyId);
    }

    // Update or create the main property entity
    const labelEntity: DataSubmittedWithLabel = {
      id: mainEntityId,
      propertyHash: event.params.propertyHash, // Always update with latest propertyHash
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: cid,
      label: metadata.label,
      id_source: idSource,
      structure_id: structureId,
      address_id: addressId,
      property_id: propertyDataId
    };

    context.DataSubmittedWithLabel.set(labelEntity);
    context.log.info(`${existingEntity ? 'Updated' : 'Created'} property entity from HeartBeat`, {
      entityId: mainEntityId,
      propertyHash: event.params.propertyHash,
      label: metadata.label,
      idSource,
      structureId,
      addressId,
      propertyDataId,
      isUpdate: !!existingEntity
    });
  } catch (error) {
    context.log.warn(`Failed to get metadata for CID from HeartBeat`, {
      cid,
      error: (error as Error).message
    });
  }
});

ERC1967Proxy.DataSubmitted.handler(async ({ event, context }) => {
  // Only process events from specific submitters
  const allowedSubmitters = [
    "0x2C810CD120eEb840a7012b77a2B4F19889Ecf65C",
    "0x2B4C5eBE66866dc0b88A05fFa4979D8830a889E9"
  ];

  if (!allowedSubmitters.includes(event.params.submitter)) {
    context.log.info(`Skipping DataSubmitted event - only processing events from specific submitters`, {
      submitter: event.params.submitter,
      propertyHash: event.params.propertyHash
    });
    return;
  }

  const entity: ERC1967Proxy_DataSubmitted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    propertyHash: event.params.propertyHash,
    dataGroupHash: event.params.dataGroupHash,
    submitter: event.params.submitter,
    dataHash: event.params.dataHash,
  };

  context.ERC1967Proxy_DataSubmitted.set(entity);

  const cid = bytes32ToCID(event.params.dataHash);

  try {
    const metadata = await context.effect(getIpfsMetadata, cid);

    // Use propertyHash as the unique ID for the property
    const propertyId = event.params.propertyHash;
    let parcelIdentifier: string | undefined;

    // Initialize entity IDs that will be populated from IPFS data
    let structureId: string | undefined;
    let addressId: string | undefined;
    let propertyDataId: string | undefined;

    if (metadata.label === "County") {
      // Process structure data if available
      const structureCid = metadata.relationships?.property_has_structure?.["/"];
      if (structureCid) {
        try {
          const relationshipData = await context.effect(getRelationshipData, structureCid);

          // Fetch structure data from "to" part
          try {
            const structureDataCid = relationshipData.to["/"];
            const structureData = await context.effect(getStructureData, structureDataCid);

            structureId = structureDataCid; // Use the CID as the structure ID
            const structureEntity: Structure = {
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
              window_screen_material: structureData.window_screen_material || undefined
            };
            context.Structure.set(structureEntity);

            context.log.info(`Updated Structure entity`, {
              structureId,
              roof_date: structureData.roof_date
            });
          } catch (structureError) {
            context.log.warn(`Failed to fetch STRUCTURE data`, {
              cid,
              structureCid,
              structureDataCid: relationshipData.to?.["/"] || "missing",
              error: (structureError as Error).message
            });
          }

          // Fetch property data from "from" part if available
          if (relationshipData.from && relationshipData.from["/"]) {
            try {
              const propertyDataCid = relationshipData.from["/"];
              const propertyData = await context.effect(getPropertyData, propertyDataCid);

              propertyDataId = propertyDataCid; // Use the CID as the property ID
              const propertyEntity: Property = {
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
              context.Property.set(propertyEntity);

              // Use parcel_identifier as the main entity ID if available
              if (propertyData.parcel_identifier) {
                parcelIdentifier = propertyData.parcel_identifier;
              }

              context.log.info(`Updated Property entity`, {
                propertyDataId,
                property_type: propertyData.property_type,
                property_structure_built_year: propertyData.property_structure_built_year,
                property_effective_built_year: propertyData.property_effective_built_year,
                parcel_identifier: propertyData.parcel_identifier
              });
            } catch (propertyError) {
              context.log.warn(`Failed to fetch PROPERTY data`, {
                cid,
                structureCid,
                propertyDataCid: relationshipData.from["/"],
                error: (propertyError as Error).message
              });
            }
          }
        } catch (relationshipError) {
          context.log.warn(`Failed to fetch RELATIONSHIP data`, {
            cid,
            structureCid,
            error: (relationshipError as Error).message
          });
        }
      }

      context.log.info(`Updated County property with structure data`, {
        propertyId,
        label: metadata.label,
        structureId
      });
    } else if (metadata.label === "Seed") {
      // Skip Seed processing - only process County labels
      context.log.info(`Skipping Seed label processing`, {
        propertyHash: event.params.propertyHash,
        label: metadata.label
      });
      return;
    }

    // Use parcel_identifier as the main entity ID, fallback to propertyHash
    const mainEntityId = parcelIdentifier || propertyId;
    const idSource = parcelIdentifier ? "parcel_identifier" : "propertyHash";

    // Check if entity exists (try parcel_identifier first, then propertyHash)
    let existingEntityDS: DataSubmittedWithLabel | undefined;
    if (parcelIdentifier) {
      existingEntityDS = await context.DataSubmittedWithLabel.get(parcelIdentifier);
    }
    if (!existingEntityDS) {
      existingEntityDS = await context.DataSubmittedWithLabel.get(propertyId);
    }

    // Update or create the main property entity
    const labelEntity: DataSubmittedWithLabel = {
      id: mainEntityId,
      propertyHash: event.params.propertyHash, // Always update with latest propertyHash
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: cid,
      label: metadata.label,
      id_source: idSource,
      structure_id: structureId,
      address_id: addressId,
      property_id: propertyDataId
    };

    context.DataSubmittedWithLabel.set(labelEntity);
    context.log.info(`${existingEntityDS ? 'Updated' : 'Created'} property entity`, {
      entityId: mainEntityId,
      propertyHash: event.params.propertyHash,
      label: metadata.label,
      idSource,
      structureId,
      addressId,
      propertyDataId,
      isUpdate: !!existingEntityDS
    });
  } catch (error) {
    context.log.warn(`Failed to get metadata for CID`, {
      cid,
      error: (error as Error).message
    });
  }
});

ERC1967Proxy.Initialized.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Initialized = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    version: event.params.version,
  };

  context.ERC1967Proxy_Initialized.set(entity);
});

ERC1967Proxy.MinimumConsensusUpdated.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_MinimumConsensusUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldValue: event.params.oldValue,
    newValue: event.params.newValue,
  };

  context.ERC1967Proxy_MinimumConsensusUpdated.set(entity);
});

ERC1967Proxy.RoleAdminChanged.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_RoleAdminChanged = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    previousAdminRole: event.params.previousAdminRole,
    newAdminRole: event.params.newAdminRole,
  };

  context.ERC1967Proxy_RoleAdminChanged.set(entity);
});

ERC1967Proxy.RoleGranted.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_RoleGranted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.ERC1967Proxy_RoleGranted.set(entity);
});

ERC1967Proxy.RoleRevoked.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_RoleRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account,
    sender: event.params.sender,
  };

  context.ERC1967Proxy_RoleRevoked.set(entity);
});

ERC1967Proxy.Upgraded.handler(async ({ event, context }) => {
  const entity: ERC1967Proxy_Upgraded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    implementation: event.params.implementation,
  };

  context.ERC1967Proxy_Upgraded.set(entity);
});
