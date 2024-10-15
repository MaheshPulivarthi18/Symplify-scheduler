// App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "./components/ui/toaster";
import Navbar from './components/navbar/NavBar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';
import './index.css';
import { LoaderIcon } from "lucide-react"
import UpdatePatient from './components/patient/profile/UpdatePatient';

// Lazy load components
const Home = lazy(() => import('./components/Home'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Schedule = lazy(() => import('./components/schedule/Schedule'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const Login = lazy(() => import('./components/auth/Login'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const Employees = lazy(() => import('./components/profile/employees/Employees'));
const Profile = lazy(() => import('./components/profile/Profile'));
const EmployeeSettings = lazy(() => import('./components/profile/employees/EmployeeSetting'));
const NewPatient = lazy(() => import('./components/patient/profile/NewPatient'));
const PatientSchedule = lazy(() => import('./components/patient/patientschedule/PatienSchedule'));
const PatientProfile = lazy(() => import('./components/patient/profile/PatientProfile'));
const PatientList = lazy(() => import('./components/patient/Patients'));
const ClinicSettings = lazy(() => import('./components/clinic/ClinicSettings'));
const ClinicInformation = lazy(() => import('./components/clinic/ClinicInformation'));
const Clinic = lazy(() => import('./components/clinic/Clinic'));
const AddClinic = lazy(() => import('./components/clinic/AddClinic'));
const Roles = lazy(() => import('./components/profile/roles/Roles'));
const RoleSettings = lazy(() => import('./components/profile/roles/RoleSetting'));
const Product = lazy(() => import('./components/profile/product/Product'));
const UpdateProduct = lazy(() => import('./components/profile/product/UpdateProduct'));
const ScheduleSettings = lazy(() => import('./components/profile/schedulesettings/ScheduleSettings'));
const WorkingHours = lazy(() => import('./components/profile/schedulesettings/WorkingHours'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<div><LoaderIcon className="animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/signup' element={<SignUp />}/>
            <Route path='/login' element={<Login />}/>
            <Route path='/forgotpassword' element={<ForgotPassword />}/>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/clinic/:clinic_id" element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/schedule" element={
              <ProtectedRoute>
                <Navbar />
                <Schedule />
              </ProtectedRoute>
            } />
            <Route path="/clinic" element={
              <ProtectedRoute>
                <Navbar />
                <Clinic />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/settings" element={
              <ProtectedRoute>
                <Navbar />
                <ClinicSettings />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/schedulesettings" element={
              <ProtectedRoute>
                <Navbar />
                <ScheduleSettings />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/workinghours" element={
              <ProtectedRoute>
                <Navbar />
                <WorkingHours />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/clinicinfo" element={
              <ProtectedRoute>
                <Navbar />
                <ClinicInformation />
              </ProtectedRoute>
            } />
            <Route path="/add-clinic" element={
              <ProtectedRoute>
                <Navbar />
                <AddClinic />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/roles" element={
              <ProtectedRoute>
                <Navbar />
                <Roles />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/roles/:role_id" element={
              <ProtectedRoute>
                <Navbar />
                <RoleSettings />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/employees" element={
              <ProtectedRoute>
                <Navbar />
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/employees/:employee_id" element={
              <ProtectedRoute>
                <Navbar />
                <EmployeeSettings />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/sellable" element={
              <ProtectedRoute>
                <Navbar />
                <Product />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/sellable/:sellable_id" element={
              <ProtectedRoute>
                <Navbar />
                <UpdateProduct />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/patients" element={
              <ProtectedRoute>
                <Navbar />
                <PatientList />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/patients/:patient_id" element={
              <ProtectedRoute>
                <Navbar />
                <PatientProfile />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/patients/:patient_id/schedule" element={
              <ProtectedRoute>
                <Navbar />
                <PatientSchedule />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/patients/new" element={
              <ProtectedRoute>
                <Navbar />
                <NewPatient />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/patients/:patient_id/update" element={
              <ProtectedRoute>
                <Navbar />
                <UpdatePatient />
              </ProtectedRoute>
            } />
            <Route path="/clinic/:clinic_id/profile" element={
              <ProtectedRoute>
                <Navbar />
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;