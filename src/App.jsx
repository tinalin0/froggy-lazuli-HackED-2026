import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import GroupsList from './pages/GroupsList';
import NewGroup from './pages/NewGroup';
import GroupDetail from './pages/GroupDetail';
import NewExpense from './pages/NewExpense';
import SettleUp from './pages/SettleUp';
import Finalize from './pages/Finalize';
import Proof from './pages/Proof';
import Activity from './pages/Activity';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<GroupsList />} />
          <Route path="/groups/new" element={<NewGroup />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/groups/:id/expenses/new" element={<NewExpense />} />
          <Route path="/groups/:id/settle" element={<SettleUp />} />
          <Route path="/groups/:id/finalize" element={<Finalize />} />
          <Route path="/groups/:id/settlements/tx/:txHash" element={<Proof />} />
          <Route path="/groups/:id/settlements/:settlementId" element={<Proof />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
