export interface SettlementTransaction {
    id: string;
    agentId: string;
    franchiseId?: string;
    totalAmount: number;
}

export const processSettlement = (transaction: SettlementTransaction) => {
    // Distributing 100-won commission based on overriding rules
    const COMMISSION_POOL = 100;
    let agentShare = 0;
    let franchiseShare = 0;
    let platformShare = 0;

    if (transaction.franchiseId) {
        // Rule: if part of franchise, split 40/40/20
        agentShare = COMMISSION_POOL * 0.4;
        franchiseShare = COMMISSION_POOL * 0.4;
        platformShare = COMMISSION_POOL * 0.2;
    } else {
        // Independent agent: split 70/30
        agentShare = COMMISSION_POOL * 0.7;
        platformShare = COMMISSION_POOL * 0.3;
    }

    return {
        transactionId: transaction.id,
        distributed: {
            agentShare,
            franchiseShare,
            platformShare
        },
        status: 'COMPLETED'
    };
};
