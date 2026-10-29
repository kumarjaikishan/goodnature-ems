import { useSelector } from 'react-redux';

/**
 * Custom hook to check user permissions
 * Action numbers: 1: Read, 2: Create, 3: Update, 4: Delete
 */
export const usePermission = (resource, action = 1) => {
    const profile = useSelector(state => state.user?.profile);
    return hasPermission(profile, resource, action);
};

/**
 * Pure function to check permission when profile object is already available.
 * Supports intelligent parent fallback:
 * - associate, partner -> fallback to "plot_sponsor"
 * - plot_purchase, kisan_seller -> fallback to "plot_inventory" (if not explicitly defined)
 * - kisan_seller -> fallback to "kisan_ledger" (if not explicitly defined)
 * - bank_ledger, cash_ledger, fund_transfer, employee_ledger, kisan_ledger, etc. -> fallback to "ledger"
 */
export const hasPermission = (profile, resource, action = 1) => {
    if (!profile) return false;
    if (profile.role === 'superadmin' || profile.role === 'developer' || profile.role === 'grant') return true;

    const permissions = profile.permissions;
    if (!permissions) return false;

    const resources = Array.isArray(resource) ? resource : [resource];

    for (const res of resources) {
        // 1. Direct resource check
        const directPerms = permissions[res];
        if (Array.isArray(directPerms) && directPerms.includes(action)) {
            return true;
        }

        // 2. Fallback for associate & partner -> plot_sponsor
        if (['associate', 'partner'].includes(res)) {
            const sponsorPerms = permissions['plot_sponsor'];
            if (Array.isArray(sponsorPerms) && sponsorPerms.includes(action)) {
                return true;
            }
        }

        // 3. Fallback for plot_purchase and kisan_seller -> plot_inventory (if not explicitly defined)
        if (['plot_purchase', 'kisan_seller'].includes(res) && !permissions.hasOwnProperty(res)) {
            const invPerms = permissions['plot_inventory'];
            if (Array.isArray(invPerms) && invPerms.includes(action)) {
                return true;
            }
        }

        // 4. Fallback for kisan_seller -> kisan_ledger (if not explicitly defined)
        if (res === 'kisan_seller' && !permissions.hasOwnProperty(res)) {
            const kisanLedgerPerms = permissions['kisan_ledger'];
            if (Array.isArray(kisanLedgerPerms) && kisanLedgerPerms.includes(action)) {
                return true;
            }
        }

        // 5. Intelligent sub-module fallback to "ledger"
        const LEDGER_SUBMODULES = ['bank_ledger', 'cash_ledger', 'fund_transfer', 'employee_ledger', 'kisan_ledger', 'associate_ledger', 'partner_ledger', 'branch_ledger'];
        if (LEDGER_SUBMODULES.includes(res)) {
            const ledgerPerms = permissions['ledger'];
            if (Array.isArray(ledgerPerms) && ledgerPerms.includes(action)) {
                return true;
            }
        }
    }

    return false;
};

export default usePermission;
