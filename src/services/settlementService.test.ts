import { processSettlement, SettlementTransaction } from './settlementService';

describe('processSettlement', () => {
    it('should split 70/30 for independent agent', () => {
        const tx: SettlementTransaction = {
            id: 'tx-1',
            agentId: 'agent-1',
            totalAmount: 1000,
        };
        const result = processSettlement(tx);
        expect(result.status).toBe('COMPLETED');
        expect(result.distributed.agentShare).toBe(70);
        expect(result.distributed.platformShare).toBe(30);
        expect(result.distributed.franchiseShare).toBe(0);
    });

    it('should split 40/40/20 for franchise agent', () => {
        const tx: SettlementTransaction = {
            id: 'tx-2',
            agentId: 'agent-2',
            franchiseId: 'fran-1',
            totalAmount: 1000,
        };
        const result = processSettlement(tx);
        expect(result.status).toBe('COMPLETED');
        expect(result.distributed.agentShare).toBe(40);
        expect(result.distributed.franchiseShare).toBe(40);
        expect(result.distributed.platformShare).toBe(20);
    });
});
