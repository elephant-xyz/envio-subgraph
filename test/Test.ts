import assert from "assert";
import { TestHelpers, ERC1967Proxy_DataSubmitted, ERC1967Proxy_DataGroupHeartBeat } from "generated";
const { MockDb, ERC1967Proxy } = TestHelpers;

describe("ERC1967Proxy contract event tests", () => {
  const mockDb = MockDb.createMockDb();

  it("ERC1967Proxy_DataSubmitted is created correctly", async () => {
    const event = ERC1967Proxy.DataSubmitted.createMockEvent({});
    const mockDbUpdated = await ERC1967Proxy.DataSubmitted.processEvent({ event, mockDb });
    const actual = mockDbUpdated.entities.ERC1967Proxy_DataSubmitted.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );
    const expected: ERC1967Proxy_DataSubmitted = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      propertyHash: event.params.propertyHash,
      dataGroupHash: event.params.dataGroupHash,
      submitter: event.params.submitter,
      dataHash: event.params.dataHash,
    };
    assert.deepEqual(actual, expected, "ERC1967Proxy_DataSubmitted entity should match");
  });

  it("ERC1967Proxy_DataGroupHeartBeat is created correctly", async () => {
    const event = ERC1967Proxy.DataGroupHeartBeat.createMockEvent({});
    const mockDbUpdated = await ERC1967Proxy.DataGroupHeartBeat.processEvent({ event, mockDb });
    const actual = mockDbUpdated.entities.ERC1967Proxy_DataGroupHeartBeat.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );
    const expected: ERC1967Proxy_DataGroupHeartBeat = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      propertyHash: event.params.propertyHash,
      dataGroupHash: event.params.dataGroupHash,
      dataHash: event.params.dataHash,
      submitter: event.params.submitter,
    };
    assert.deepEqual(actual, expected, "ERC1967Proxy_DataGroupHeartBeat entity should match");
  });
});
