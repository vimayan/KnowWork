import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './store/authStore.js';
import Navbar  from './components/layout/Navbar.jsx';
import Footer  from './components/layout/Footer.jsx';
import { Spinner } from './components/ui/index.jsx';

const Home          = lazy(() => import('./pages/Home.jsx'));
const Roadmaps      = lazy(() => import('./pages/Roadmaps.jsx'));
const RoadmapDetail = lazy(() => import('./pages/RoadmapDetail.jsx'));
const CareerRoadmap = lazy(() => import('./pages/CareerRoadmap.jsx'));
const Categories    = lazy(() => import('./pages/Categories.jsx'));
const SalaryAnalytics = lazy(() => import('./pages/SalaryAnalytics.jsx'));
const Compare       = lazy(() => import('./pages/Compare.jsx'));
const FindMentor    = lazy(() => import('./pages/FindMentor.jsx'));
const MentorProfile = lazy(() => import('./pages/MentorProfile.jsx'));
const AddJourney    = lazy(() => import('./pages/AddJourney.jsx'));
const AiBeta        = lazy(() => import('./pages/AiBeta.jsx'));
const Dashboard     = lazy(() => import('./pages/Dashboard.jsx'));
const Login         = lazy(() => import('./pages/Login.jsx'));
const Register      = lazy(() => import('./pages/Register.jsx'));
const Profile       = lazy(() => import('./pages/Profile.jsx'));
const NotFound      = lazy(() => import('./pages/NotFound.jsx'));
const BuildRoadmap  = lazy(() => import('./pages/BuildRoadmap.jsx'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={32} />
    </div>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const init = useAuthStore(s => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/roadmaps"      element={<Roadmaps />} />
            <Route path="/roadmaps/:id"  element={<RoadmapDetail />} />
            <Route path="/career/:slug"  element={<CareerRoadmap />} />
            <Route path="/categories"    element={<Categories />} />
            <Route path="/salary"        element={<SalaryAnalytics />} />
            <Route path="/salary/:slug"  element={<SalaryAnalytics />} />
            <Route path="/compare"       element={<Compare />} />
            <Route path="/mentors"       element={<FindMentor />} />
            <Route path="/mentors/:id"   element={<MentorProfile />} />
            <Route path="/journey/new"   element={<AddJourney />} />
            <Route path="/build-roadmap" element={<BuildRoadmap />} />
            <Route path="/ai-guide"      element={<AiBeta />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/register"      element={<Register />} />
            <Route path="/profile"       element={<Profile />} />
            <Route path="*"              element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
