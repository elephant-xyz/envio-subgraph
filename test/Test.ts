import assert from "assert";
import { TestHelpers, ERC1967Proxy_DataSubmitted } from "generated";
const { MockDb, ERC1967Proxy } = TestHelpers;

describe("ERC1967Proxy contract DataSubmitted event tests", () => {
  const mockDb = MockDb.createMockDb();

  const event = ERC1967Proxy.DataSubmitted.createMockEvent({});

  it("ERC1967Proxy_DataSubmitted is created correctly", async () => {
    const mockDbUpdated = await ERC1967Proxy.DataSubmitted.processEvent({
      event,
      mockDb,
    });

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

    assert.deepEqual(actual, expected, "ERC1967Proxy_DataSubmitted should match expected");
  });
});
