/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ERC1967Proxy,
  ERC1967Proxy_DataGroupHeartBeat,
  ERC1967Proxy_DataSubmitted,
  DataSubmittedWithLabel,
  Structure,
  Address,
  Property,
  Ipfs,
} from "generated";

import { bytes32ToCID, getIpfsMetadata, getPropertyData } from "./utils/ipfs";
import { getAllowedSubmitters, processCountyData } from "./utils/eventHelpers";

// Get allowed submitters from environment variables - this will crash if none found
const allowedSubmitters = getAllowedSubmitters();

ERC1967Proxy.DataGroupHeartBeat.handler(async ({ event, context }) => {
  if (!allowedSubmitters.includes(event.params.submitter)) {
    // Skipping HeartBeat event - only processing events from specific submitters
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

  // Find existing DataSubmittedWithLabel using same logic as DataSubmitted
  const propertyHash = event.params.propertyHash;
  const currentTimestamp = BigInt(event.block.timestamp);
  const cid = bytes32ToCID(event.params.dataHash);

  try {
    const metadata = await context.effect(getIpfsMetadata, cid);

    // Skip if not County label
    if (metadata.label !== "County") {
      context.log.info(`Skipping HeartBeat - label is not County`, {
        propertyHash,
        label: metadata.label,
        cid
      });
      return;
    }

    const propertyId = event.params.propertyHash;
    let parcelIdentifier: string | undefined;

    // Process County data to get parcel_identifier
    const result = await processCountyData(context, metadata, cid, propertyId);
    if (result) {
      parcelIdentifier = result.parcelIdentifier;
    }

    // Only use parcel_identifier as property ID - skip if not found
    if (!parcelIdentifier) {
      context.log.info(`Skipping HeartBeat - no parcel_identifier found`, {
        propertyHash,
        cid
      });
      return;
    }

    const mainEntityId = parcelIdentifier;

    // Check if entity exists (try parcel_identifier first, then propertyHash)
    let existingEntity: DataSubmittedWithLabel | undefined;
    if (parcelIdentifier) {
      existingEntity = await context.DataSubmittedWithLabel.get(parcelIdentifier);
    }
    if (!existingEntity) {
      existingEntity = await context.DataSubmittedWithLabel.get(propertyId);
    }

    if (existingEntity) {
      // Update the datetime field
      const updatedEntity: DataSubmittedWithLabel = {
        ...existingEntity,
        datetime: currentTimestamp,
      };

      context.DataSubmittedWithLabel.set(updatedEntity);

      context.log.info(`Updated datetime for property from HeartBeat`, {
        propertyHash,
        entityId: existingEntity.id,
        mainEntityId,
        newDatetime: currentTimestamp.toString(),
      });
    } else {
      context.log.warn(`DataSubmittedWithLabel not found for HeartBeat`, {
        propertyHash,
        mainEntityId,
      });
    }
  } catch (error) {
    context.log.warn(`Failed to update datetime from HeartBeat`, {
      propertyHash,
      cid,
      error: (error as Error).message
    });
  }
});

ERC1967Proxy.DataSubmitted.handler(async ({ event, context }) => {
  // Topic filtering applied via eventFilters - only allowed submitters reach this handler

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
    let addressId: string | undefined;
    let propertyDataId: string | undefined;
    let ipfsId: string | undefined;
    let lotId: string | undefined;
    let floodStormId: string | undefined;

    if (metadata.label === "County") {
      // Process County data first to get parcel_identifier
      const result = await processCountyData(context, metadata, cid, propertyId);
      if (result) {
        addressId = result.addressId;
        propertyDataId = result.propertyDataId;
        ipfsId = result.ipfsId;
        lotId = result.lotId;
        floodStormId = result.floodStormId;
        parcelIdentifier = result.parcelIdentifier;

        // Only use parcel_identifier as property ID - skip if not found
        if (!parcelIdentifier) {
          context.log.info(`Skipping DataSubmitted - no parcel_identifier found`, {
            propertyHash: event.params.propertyHash,
            cid,
            metadataLabel: metadata.label
          });
          return;
        }

        const mainEntityId = parcelIdentifier;

        // Re-process sales history with correct mainEntityId if parcelIdentifier exists
        if (parcelIdentifier && parcelIdentifier !== propertyId) {
          // Need to update sales history entities with correct property_id
          for (const salesEntity of result.salesHistoryEntities) {
            const updatedSalesEntity = {
              ...salesEntity,
              property_id: mainEntityId
            };
            context.SalesHistory.set(updatedSalesEntity);
          }

          // Need to update tax entities with correct property_id
          for (const taxEntity of result.taxEntities) {
            const updatedTaxEntity = {
              ...taxEntity,
              property_id: mainEntityId
            };
            context.Tax.set(updatedTaxEntity);
          }

          // Need to update person entities with correct property_id
          for (const personEntity of result.personEntities) {
            const updatedPersonEntity = {
              ...personEntity,
              property_id: mainEntityId
            };
            context.Person.set(updatedPersonEntity);
          }

          // Need to update company entities with correct property_id
          for (const companyEntity of result.companyEntities) {
            const updatedCompanyEntity = {
              ...companyEntity,
              property_id: mainEntityId
            };
            context.Company.set(updatedCompanyEntity);
          }

          // Need to update layout entities with correct property_id
          for (const layoutEntity of result.layoutEntities) {
            const updatedLayoutEntity = {
              ...layoutEntity,
              property_id: mainEntityId
            };
            context.Layout.set(updatedLayoutEntity);
          }

          // Need to update file entities with correct property_id
          for (const fileEntity of result.fileEntities) {
            const updatedFileEntity = {
              ...fileEntity,
              property_id: mainEntityId
            };
            context.File.set(updatedFileEntity);
          }
        }
      }

    } else if (metadata.label === "Seed") {
      // Skip Seed processing - only process County labels
      return;
    }

    // Skip if no parcel_identifier found - only process County events with parcel identifiers
    if (!parcelIdentifier) {
      context.log.info(`Skipping DataSubmitted - no parcel_identifier found`, {
        propertyHash: event.params.propertyHash,
        cid,
        metadataLabel: metadata.label
      });
      return;
    }

    // Use parcel_identifier as the main entity ID only
    const mainEntityId = parcelIdentifier;
    const idSource = "parcel_identifier";

    // Check if entity exists
    let existingEntityDS: DataSubmittedWithLabel | undefined;
    existingEntityDS = await context.DataSubmittedWithLabel.get(parcelIdentifier);

    // Update or create the main property entity
    const labelEntity: DataSubmittedWithLabel = {
      id: mainEntityId,
      propertyHash: event.params.propertyHash, // Always update with latest propertyHash
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: cid,
      label: metadata.label,
      id_source: idSource,
      address_id: addressId,
      property_id: propertyDataId,
      ipfs_id: ipfsId,
      lot_id: lotId,
      flood_storm_information_id: floodStormId,
      datetime: BigInt(event.block.timestamp),
    };

    context.DataSubmittedWithLabel.set(labelEntity);
    context.log.info(`${existingEntityDS ? 'Updated' : 'Created'} property entity`, {
      entityId: mainEntityId,
      propertyHash: event.params.propertyHash,
      label: metadata.label,
      idSource,
      addressId,
      propertyDataId,
      isUpdate: !!existingEntityDS,
      datetime: labelEntity.datetime?.toString()
    });
  } catch (error) {
    context.log.warn(`Failed to get metadata for CID`, {
      cid,
      error: (error as Error).message
    });
  }
}, { eventFilters: { submitter: allowedSubmitters } });
