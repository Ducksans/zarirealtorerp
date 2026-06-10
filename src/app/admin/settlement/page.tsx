import { redirect } from 'next/navigation';

export default function SettlementRedirect() {
    redirect('/admin/settlements');
}
