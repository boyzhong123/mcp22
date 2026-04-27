import { redirect } from 'next/navigation';

export default function DevEnDashboardIndex() {
  redirect('/dashboard/overview');
}
