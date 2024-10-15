// PatientList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('last_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const navigate = useNavigate();
  const { clinic_id } = useParams();
  const { authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(13);
  const [therapists, setTherapists] = useState([])
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(interval);
            return 100;
          }
          const newProgress = oldProgress + Math.random() * 10;
          return Math.min(newProgress, 90);
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchPatients();
    fetchTherapists();
  }, [clinic_id]);
 
  useEffect(() => {
    const filtered = patients.filter(patient =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = sortPatients(filtered);
    setFilteredPatients(sorted);
  }, [searchTerm, patients, sortField, sortDirection]);

  const fetchPatients = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchTherapists = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/`);
      if (!response.ok) throw new Error('Failed to fetch therapists');
      const data = await response.json();
      const therapistList = data.filter(employee => employee.is_therapist);
      setTherapists(therapistList);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch therapists. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTherapistName = (therapistId) => {
    const therapist = therapists.find(t => t.id === therapistId);
    return therapist ? `${therapist.first_name} ${therapist.last_name}` : 'Not Assigned';
  };

  const sortPatients = (patients) => {
    return patients.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (field !== sortField) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading patients... {Math.round(progress)}%</p>
      </div>
    );
  }
  
  return (
    <Card className="w-full mx-auto mt-8 container p-4 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Patient Management</CardTitle>
        <br />
        <div className="flex justify-around mt-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Total Patients</h2>
            <p>{patients.length}</p>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Active Patients</h2>
            <p className="text-green-600">{patients.filter(p => p.is_patient_active).length}</p>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Inactive Patients</h2>
            <p className="text-red-600">{patients.length-patients.filter(p => p.is_patient_active).length}</p>
          </div>
        </div>
        <br/>
        <div className="flex justify-between items-center mt-4">
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => navigate(`/clinic/${clinic_id}/patients/new`)}>Add New Patient</Button>
        </div>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="text-center py-4">
            <p className="mb-4">No patients found in this clinic.</p>
            <Button onClick={() => navigate(`/clinic/${clinic_id}/patients/new`)}>Add Your First Patient</Button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-4">
            <p>No patients match your search.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-center'>
                      <Button variant="ghost" onClick={() => handleSort('first_name')}>Name 
                        <SortIcon field="first_name" /></Button>
                </TableHead>
                <TableHead className='text-center'>
                        status
                 </TableHead>
                <TableHead className='text-center'>
                  <Button variant="ghost" 
                     onClick={() => handleSort('email')}
                  >
                    Email 
                    { <SortIcon field="email" /> }
                  </Button>
                </TableHead>
                <TableHead className='text-center'>
                  <Button variant="ghost" 
                    onClick={() => handleSort('mobile')}
                    >
                    Mobile
                    <SortIcon field="email" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('therapist_primary')}>
                    Primary Therapist <SortIcon field="therapist_primary" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map(patient => (
                <TableRow key={patient.id}>
                  <TableCell className="py-2">
                    <div className="flex items-center">
                      <Avatar className="mr-2">
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${patient.first_name} ${patient.last_name}`} />
                        <AvatarFallback>{patient.first_name}{patient.last_name}</AvatarFallback>
                      </Avatar>
                      {patient.first_name} {patient.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                       {patient.is_patient_active ? (
  <div className="inline-block px-2 py-1 text-green-800 bg-green-300 rounded-full border border-green-600">
    Active
  </div>
) : (
  <div className="inline-block px-2 py-1 text-sm text-red-600 bg-red-100 rounded-full border border-red-600">
    NotActive
  </div>
)}
                   </TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.mobile}</TableCell>
                  <TableCell>{getTherapistName(patient.therapist_primary)}</TableCell>
                  <TableCell>
                    <Link to={`/clinic/${clinic_id}/patients/${patient.id}`}>
                      <Button variant="outline">View Profile</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
    </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientList;