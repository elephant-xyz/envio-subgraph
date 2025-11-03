/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  ERC1967Proxy,
  ERC1967Proxy_DataGroupHeartBeat,
  ERC1967Proxy_DataSubmitted,
  DataSubmittedWithLabel,
  Address,
  Property,
  Ipfs,
} from "generated";

import { bytes32ToCID, getIpfsMetadata, getPropertyData, getPropertySeedData, getAddressData, getRelationshipData, getImprovementData, getInspectionData, getFileData, getParcelData, getCompanyData, getPersonData, enableImprovements } from "./utils/ipfs";
import { getAllowedSubmitters, processCountyData, createImprovementEntity, createCompanyEntity, createPersonEntity } from "./utils/eventHelpers";

// Get allowed submitters from environment variables - this will crash if none found
const allowedSubmitters = getAllowedSubmitters();

// Flag to enable minimal mode - only fetch propertyHash and dataHash CIDs
// Set ENVIO_MINIMAL_MODE=true to enable
const MINIMAL_MODE = process.env.ENVIO_MINIMAL_MODE === 'true';

ERC1967Proxy.DataGroupHeartBeat.handler(async ({ event, context }) => {
  // Manual check required since submitter is not an indexed parameter
  if (!allowedSubmitters.includes(event.params.submitter)) {
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
    const metaStart = Date.now();
    const metadata = await context.effect(getIpfsMetadata, cid);
    context.log.info("IPFS metadata phase fetched", {
      cid,
      durationMs: Date.now() - metaStart,
    });

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

  // Transform both propertyHash and dataHash to CIDs
  // Note: event.params.propertyHash and event.params.dataHash come as hex strings
  // bytes32ToCID handles both formats with or without 0x prefix
  const propertyHashCid = bytes32ToCID(event.params.propertyHash);
  const dataHashCid = bytes32ToCID(event.params.dataHash);

  // Minimal mode: only store propertyHash CID and dataHash CID
  if (MINIMAL_MODE) {
    const minimalEntity: DataSubmittedWithLabel = {
      id: `${event.chainId}_${event.params.propertyHash}`,
      propertyHash: event.params.propertyHash,
      property_cid: propertyHashCid,
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: dataHashCid,
      label: "Minimal", // Placeholder label
      id_source: "propertyHash",
      address_id: undefined,
      property_id: undefined,
      ipfs_id: undefined,
      datetime: BigInt(event.block.timestamp),
    };

    context.DataSubmittedWithLabel.set(minimalEntity);
    
    context.log.info(`Created minimal DataSubmitted entity with CIDs`, {
      propertyHashCid,
      dataHashCid,
      propertyHash: event.params.propertyHash,
      dataHash: event.params.dataHash,
    });
    return;
  }

  // Full mode: existing processing logic
  const cid = dataHashCid;

  try {
    let metadata = await context.effect(getIpfsMetadata, cid);
    // If dataHashCid points to a relationship, follow ends to find a labeled node
    if (metadata.label === "Relationship") {
      try {
        const rel0 = await context.effect(getRelationshipData, cid);
        const candidates = [rel0.to?.["/"], rel0.from?.["/"]].filter(Boolean) as string[];
        for (const c of candidates) {
          try {
            const m = await context.effect(getIpfsMetadata, c);
            if (m.label !== "Relationship") {
              metadata = m;
              // Switch processing CID to the labeled node
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              cid = c;
              context.log.info("Resolved relationship dataHash to labeled node", { originalCid: dataHashCid, resolvedCid: c, label: m.label });
              break;
            }
          } catch {}
        }
      } catch (e) {
        context.log.warn("Failed to resolve relationship dataHash to labeled node", { cid: dataHashCid, error: (e as Error).message });
      }
    }

    // Use propertyHash as the unique ID for the property
    const propertyId = event.params.propertyHash;
    let parcelIdentifier: string | undefined;

    // Initialize entity IDs that will be populated from IPFS data
    let addressId: string | undefined;
    let propertyDataId: string | undefined;
    let ipfsId: string | undefined;

    // Always fetch address data from propertyHash relationships (property/property_seed and property_address/address)
    try {
      const propertyRootMeta = await context.effect(getIpfsMetadata, propertyHashCid);
      const relationships: any = propertyRootMeta?.relationships || {};
      const seedRelCid: string | undefined = relationships?.property_seed?.["/"] || relationships?.property?.["/"];
      const addrRelCid: string | undefined = relationships?.property_address?.["/"] || relationships?.address?.["/"];

      // Fetch seed/property JSON for address fallbacks
      let seedData: any | undefined;
      if (seedRelCid) {
        try {
          seedData = await context.effect(getPropertySeedData, { cid: seedRelCid });
        } catch (e) {
          context.log.warn("Failed to fetch property seed/property JSON", {
            cid: seedRelCid,
            error: (e as Error).message,
          });
        }
      }

      // Prefer dedicated address JSON if present
      let addrData: any | undefined;
      if (addrRelCid && getAddressData) {
        try {
          addrData = await context.effect(getAddressData, addrRelCid);
        } catch (e) {
          context.log.warn("Failed to fetch address relationship JSON", {
            cid: addrRelCid,
            error: (e as Error).message,
          });
        }
      }

      const addressEntityId = addrRelCid || seedRelCid;
      if (addressEntityId) {
        const addressEntity: Address = {
          id: addressEntityId,
          county_name: addrData?.county_name || undefined,
          request_identifier: addrData?.request_identifier || seedData?.request_identifier || undefined,
          block: addrData?.block || undefined,
          city_name: addrData?.city_name || seedData?.city_name || undefined,
          country_code: addrData?.country_code || seedData?.country_code || undefined,
          latitude: addrData?.latitude || undefined,
          longitude: addrData?.longitude || undefined,
          lot: addrData?.lot || undefined,
          municipality_name: addrData?.municipality_name || undefined,
          plus_four_postal_code: addrData?.plus_four_postal_code || undefined,
          postal_code: addrData?.postal_code || seedData?.postal_code || undefined,
          range: addrData?.range || undefined,
          route_number: addrData?.route_number || undefined,
          section: addrData?.section || undefined,
          state_code: addrData?.state_code || seedData?.state_code || undefined,
          street_direction_prefix: addrData?.street_pre_directional_text || undefined,
          street_direction_suffix: addrData?.street_post_directional_text || undefined,
          street_name: addrData?.street_name || undefined,
          street_number: addrData?.street_number || undefined,
          street_suffix: addrData?.street_suffix_type || undefined,
          unit_identifier: addrData?.unit_identifier || undefined,
          township: addrData?.township || undefined,
          // Prefer explicit unnormalized_address, then full_address, then seed.address string
          unnormalized_address: (addrData?.unnormalized_address || addrData?.full_address || seedData?.unnormalized_address || seedData?.address) || undefined,
        };
        context.Address.set(addressEntity);
        addressId = addressEntityId;
      }
    } catch (e) {
      context.log.warn("Failed to derive address from propertyHash root", {
        propertyHashCid,
        error: (e as Error).message,
      });
    }

    // Fallback: derive parcel_identifier from propertyHash root by traversing property_has_address → Property JSON,
    // or directly via property relationship, or finally from property_seed.request_identifier
    // This runs for any label when parcelIdentifier hasn't been resolved yet
    if (!parcelIdentifier) {
      try {
        const propertyRootMeta = await context.effect(getIpfsMetadata, propertyHashCid);
        const rels: any = (propertyRootMeta as any)?.relationships || {};
        const relCid = rels?.property_has_address?.["/"];
        if (relCid) {
          try {
            const rel = await context.effect(getRelationshipData, relCid);
            const maybePropertyCid = rel.from?.["/"] || rel.to?.["/"];
            if (maybePropertyCid) {
              try {
                const propData = await context.effect(getPropertyData, maybePropertyCid);
                if (propData?.parcel_identifier) {
                  parcelIdentifier = propData.parcel_identifier as string;
                  propertyDataId = parcelIdentifier;
                  context.log.info("Derived parcel_identifier from propertyHash root via property_has_address", {
                    propertyHashCid,
                    propertyCid: maybePropertyCid,
                    parcelIdentifier,
                  });
                }
              } catch (e) {
                context.log.warn("Failed to fetch Property JSON from property_has_address", { relCid, error: (e as Error).message });
              }
            }
          } catch (e) {
            context.log.warn("Failed to fetch property_has_address relationship from propertyHash root", { relCid, error: (e as Error).message });
          }
        }

        // Try direct property relationship if available
        if (!parcelIdentifier && rels?.property?.["/"]) {
          const propCid = rels.property["/"];
          try {
            const propData = await context.effect(getPropertyData, propCid);
            if (propData?.parcel_identifier) {
              parcelIdentifier = propData.parcel_identifier as string;
              propertyDataId = parcelIdentifier;
              context.log.info("Derived parcel_identifier from propertyHash root via property", {
                propertyHashCid,
                propertyCid: propCid,
                parcelIdentifier,
              });
            }
          } catch (e) {
            context.log.warn("Failed to fetch Property JSON from property relationship", { propCid, error: (e as Error).message });
          }
        }

        // Fallback: traverse from property_seed to find a Property JSON and extract parcel_identifier
        if (!parcelIdentifier && rels?.property_seed?.["/"]) {
          const seedCid = rels.property_seed["/"];
          try {
            // Seed points to a relationship (from seed to property). Follow it.
            const seedRel = await context.effect(getRelationshipData, seedCid);
            const firstHop = [seedRel.to?.["/"], seedRel.from?.["/"]].filter(Boolean) as string[];

            // Try candidates directly as Property JSON
            for (const cand of firstHop) {
              if (parcelIdentifier) break;
              try {
                const propData = await context.effect(getPropertyData, cand);
                if (propData?.parcel_identifier) {
                  parcelIdentifier = propData.parcel_identifier as string; // handles parcel_id fallback
                  propertyDataId = parcelIdentifier;
                  context.log.info("Derived parcel_identifier via property_seed direct hop", {
                    propertyHashCid,
                    seedCid,
                    propertyCid: cand,
                    parcelIdentifier,
                  });
                  break;
                }
              } catch {}
            }

            // If still not found, expand one more hop through relationship candidates
            if (!parcelIdentifier) {
              for (const cand of firstHop) {
                if (parcelIdentifier) break;
                try {
                  const rel2 = await context.effect(getRelationshipData, cand);
                  const secondHop = [rel2.to?.["/"], rel2.from?.["/"]].filter(Boolean) as string[];
                  for (const c2 of secondHop) {
                    if (parcelIdentifier) break;
                    try {
                      const propData = await context.effect(getPropertyData, c2);
                      if (propData?.parcel_identifier) {
                        parcelIdentifier = propData.parcel_identifier as string;
                        propertyDataId = parcelIdentifier;
                        context.log.info("Derived parcel_identifier via property_seed two-hop traversal", {
                          propertyHashCid,
                          seedCid,
                          viaCid: cand,
                          propertyCid: c2,
                          parcelIdentifier,
                        });
                        break;
                      }
                    } catch {}
                  }
                } catch {}
              }
            }
          } catch (e) {
            context.log.warn("Failed to traverse property_seed for parcel fallback", { seedCid, error: (e as Error).message });
          }
        }
      } catch (e) {
        context.log.warn("Failed to re-read propertyHash root metadata for parcel fallback", { propertyHashCid, error: (e as Error).message });
      }
    }

    // Process Property Improvements if present and enabled
    if (enableImprovements) {
      const impRefs = (metadata as any)?.relationships?.property_has_improvement;
      if (Array.isArray(impRefs) && impRefs.length > 0) {
        for (const ref of impRefs) {
          const relCid: string | undefined = ref?.["/"];
          if (!relCid) continue;
          try {
            const rel = await context.effect(getRelationshipData, relCid);
            const propCid = rel.from?.["/"];
            const impCid = rel.to?.["/"];
            if (!propCid || !impCid) continue;

            // Fetch property to resolve parcel_identifier (required for property_id)
            const prop = await context.effect(getPropertyData, propCid);
            const effectivePropertyId = prop.parcel_identifier as string | undefined;
            if (!effectivePropertyId) {
              context.log.info("Skipping improvement - no parcel_identifier on property", { relCid, propCid });
              continue;
            }

            // Fetch improvement data and upsert entity (Elephant-detailed)
            const imp = await context.effect(getImprovementData, impCid);
            const improvementEntity = createImprovementEntity(impCid, imp, effectivePropertyId);
            context.Improvement.set(improvementEntity as any);
          } catch (e) {
            context.log.warn("Failed processing improvement relationship", {
              relCid,
              error: (e as Error).message,
            });
          }
        }
      }
    }

    // Always upsert a propertyHash-level row capturing address linkage, regardless of label/parcel availability
    {
      const propertyHashEntityId = `${event.chainId}_${event.params.propertyHash}`;
      const existingPH = await context.DataSubmittedWithLabel.get(propertyHashEntityId);
      const baseEntity: DataSubmittedWithLabel = existingPH ? {
        ...existingPH,
        propertyHash: event.params.propertyHash,
        property_cid: propertyHashCid,
        submitter: event.params.submitter,
        dataHash: event.params.dataHash,
        cid: cid,
        label: metadata.label,
        id_source: "propertyHash",
        address_id: addressId ?? existingPH.address_id,
        datetime: BigInt(event.block.timestamp),
      } : {
        id: propertyHashEntityId,
        propertyHash: event.params.propertyHash,
        property_cid: propertyHashCid,
        submitter: event.params.submitter,
        dataHash: event.params.dataHash,
        cid: cid,
        label: metadata.label,
        id_source: "propertyHash",
        address_id: addressId,
        property_id: undefined,
        ipfs_id: undefined,
        datetime: BigInt(event.block.timestamp),
      };
      context.DataSubmittedWithLabel.set(baseEntity);
    }

    if (metadata.label === "County") {
      // Process County data first to get parcel_identifier
      const result = await processCountyData(context, metadata, cid, propertyId);
      if (result) {
        addressId = result.addressId;
        propertyDataId = result.propertyDataId;
        ipfsId = result.ipfsId;
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

          // Removed person/company updates as those entities are no longer indexed

          
        }
      }

    }

    // Handle direct Property Improvement submissions
    if (enableImprovements && metadata.label === "Property Improvement") {
      try {
        const relCid = (metadata as any)?.relationships?.parcel_has_property_improvement?.["/"];
        if (relCid) {
        const rel = await context.effect(getRelationshipData, relCid);
        const fromCid = rel.from?.["/"];
        const toCid = rel.to?.["/"];
        const impCid = toCid || cid;

          // Relationship is parcel_has_property_improvement, so 'from' is Parcel.
          if (fromCid && !parcelIdentifier) {
            try {
              const parcel = await context.effect(getParcelData, fromCid);
              const pid = parcel.parcel_identifier || parcel.parcel_id;
              if (pid) {
                parcelIdentifier = pid as string;
                propertyDataId = parcelIdentifier;
                context.log.info("Derived parcel_identifier from Parcel via parcel_has_property_improvement", { relCid, parcelCid: fromCid, parcelIdentifier });
              }
            } catch (e) {
              context.log.warn("Failed to fetch Parcel for improvement relationship", { relCid, parcelCid: fromCid, error: (e as Error).message });
            }
          }

          // If we have parcelIdentifier, index the improvement itself
          if (parcelIdentifier) {
            try {
              const impData = await context.effect(getImprovementData, impCid);
              const impEntity = createImprovementEntity(impCid, impData, parcelIdentifier);
              context.Improvement.set(impEntity as any);
            } catch (e) {
              context.log.warn("Failed to fetch improvement data for direct improvement submission", { impCid, error: (e as Error).message });
            }

            // Traverse improvement-owned relationships: inspections, files, contractors and personnel
            const inspRelRefs = (metadata as any)?.relationships?.property_improvement_has_inspection || [];
            for (const ref of inspRelRefs) {
              const inspRelCid = ref?.["/"];
              if (!inspRelCid) continue;
              try {
                const r = await context.effect(getRelationshipData, inspRelCid);
                const targetCid = r.to?.["/"] || r.from?.["/"];
                if (!targetCid) continue;
                try {
                  const insp = await context.effect(getInspectionData, targetCid);
                  context.Inspection.set({
                    id: targetCid,
                    completed_date: insp.completed_date || undefined,
                    completed_time: insp.completed_time || undefined,
                    inspection_number: insp.inspection_number || undefined,
                    inspection_status: insp.inspection_status || undefined,
                    permit_number: insp.permit_number || undefined,
                    requested_date: insp.requested_date || undefined,
                    scheduled_date: insp.scheduled_date || undefined,
                    property_id: parcelIdentifier!
                  } as any);
                } catch (e) {
                  context.log.warn("Failed to fetch inspection data for improvement", { inspRelCid, error: (e as Error).message });
                }
              } catch (e) {
                context.log.warn("Failed to fetch inspection relationship for improvement", { ref: inspRelCid, error: (e as Error).message });
              }
            }

            const fileRelRefs = (metadata as any)?.relationships?.property_improvement_has_file || [];
            for (const ref of fileRelRefs) {
              const fileRelCid = ref?.["/"];
              if (!fileRelCid) continue;
              try {
                const r = await context.effect(getRelationshipData, fileRelCid);
                const targetCid = r.to?.["/"] || r.from?.["/"];
                if (!targetCid) continue;
                try {
                  const f = await context.effect(getFileData, targetCid);
                  context.File.set({
                    id: targetCid,
                    document_type: f.document_type || undefined,
                    file_format: f.file_format || undefined,
                    ipfs_url: f.ipfs_url || undefined,
                    name: f.name || undefined,
                    original_url: f.original_url || undefined,
                    request_identifier: f.request_identifier || undefined,
                    property_id: parcelIdentifier!
                  } as any);
                } catch (e) {
                  context.log.warn("Failed to fetch file data for improvement", { fileRelCid, error: (e as Error).message });
                }
              } catch (e) {
                context.log.warn("Failed to fetch file relationship for improvement", { ref: fileRelCid, error: (e as Error).message });
              }
            }

            const contractorRefs = (metadata as any)?.relationships?.property_improvement_has_contractor || [];
            for (const ref of contractorRefs) {
              const contractorRelCid = ref?.["/"];
              if (!contractorRelCid) continue;
              try {
                const r = await context.effect(getRelationshipData, contractorRelCid);
                const endpoints = [r.to?.["/"], r.from?.["/"]].filter(Boolean) as string[];
                for (const ep of endpoints) {
                  try {
                    const c = await context.effect(getCompanyData, ep);
                    if (c && (c.name || c.request_identifier)) {
                      const companyEntity = createCompanyEntity(ep, c, parcelIdentifier!);
                      context.Company.set(companyEntity as any);
                    }
                  } catch {}
                }
              } catch (e) {
                context.log.warn("Failed to fetch contractor relationship for improvement", { ref: contractorRelCid, error: (e as Error).message });
              }
            }

            const contractorPersonRefs = (metadata as any)?.relationships?.contractor_has_person || [];
            for (const ref of contractorPersonRefs) {
              const pRelCid = ref?.["/"];
              if (!pRelCid) continue;
              try {
                const r = await context.effect(getRelationshipData, pRelCid);
                const endpoints = [r.to?.["/"], r.from?.["/"]].filter(Boolean) as string[];
                for (const ep of endpoints) {
                  try {
                    const p = await context.effect(getPersonData, ep);
                    if (p && (p.first_name || p.last_name || p.request_identifier)) {
                      const personEntity = createPersonEntity(ep, p, parcelIdentifier!);
                      context.Person.set(personEntity as any);
                    }
                  } catch {}
                }
              } catch (e) {
                context.log.warn("Failed to fetch contractor_has_person relationship for improvement", { ref: pRelCid, error: (e as Error).message });
              }
            }
          }
        }
      } catch (e) {
        context.log.warn("Failed processing direct Property Improvement label", { cid, error: (e as Error).message });
      }
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
      property_cid: propertyHashCid,
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
      cid: cid,
      label: metadata.label,
      id_source: idSource,
      address_id: addressId,
      property_id: propertyDataId,
      ipfs_id: ipfsId,
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
