import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Menu, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import employee from "../../assets/employee.svg";
import patient from "../../assets/patient.svg";

const Dashboard = () => {
  const { clinic_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({
    visits: 0,
    received: 0,
    pending: 0,
    recentCancellations: 0,
  });

  // Dummy data
  const doctors = ['Dr. Brown', 'Dr. White', 'Dr. Green', 'Dr. Yellow', 'Dr. Red', 'Dr. Orange'];
  const appointmentsData = [
    { details: "Checkup with John Doe at 10:00 AM", id: 1 },
  ];
  const upcomingAppointments = [
    { details: "Checkup with John Doe at 10:00 AM" },
    { details: "Consultation with Jane Smith at 11:30 AM" }
  ];
  const summaryData = {
    visits: 5,
    received: 10,
    pending: 3,
    recentCancellations: 2
  };

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
      }, 50);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Simulate fetching data from backend
    const fetchData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAppointments(appointmentsData);
      setSummary(summaryData);
      setProgress(100);
      setLoading(false);
      setIsVisible(true);
    };

    fetchData();
  }, []);

  const refreshAppointments = () => {
    console.log(appointments);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading dashboard... {Math.round(progress)}%</p>
      </div>
    );
  }

    return (
      <Card className={`container mx-auto p-4 w-full shadow-xl transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>  
        <main className={`space-y-6`}>
          <section className="flex gap-4">
            <Card className="flex-1 shadow-inner bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  Today's Appointments ({appointmentsData.length}) 
                  <RefreshCw size={18} onClick={() => refreshAppointments()} className="cursor-pointer" />
                </CardTitle>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor} value={doctor}>{doctor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-4 rounded-md">
                {appointmentsData.length === 0 ? "No upcoming appointments" : (
                  // Render today's appointments here
                  <ul className='flex flex-col gap-4'>
                    {appointmentsData.map(appointment => (
                      <li key={appointment.id}>
                      <Button>
                      {appointment.details}
                      </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
  
            <Card className="flex-1 shadow-inner bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-6 justify-between">
                  Upcoming appointments
                  <span className="text-sm text-blue-600 cursor-pointer" onClick={() => navigate('/appointments')}>View all</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-4xl font-bold">
                {upcomingAppointments.length}
              </CardContent>
              <Button className="" onClick={() => navigate(`/clinic/${clinic_id}/schedule`)}>
                Schedule appointment
              </Button>
            </Card>

            <Card className='flex-1 shadow-inner bg-gray-50'>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(summary).map(([key, value]) => (
                    <div key={key} className="border rounded-md p-2 shadow-inner">
                      <div className="text-sm text-gray-600">{key}</div>
                      <div className="text-2xl font-bold">{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
  
  
  
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center cursor-pointer shadow-inner bg-gray-50" onClick={() => navigate(`/clinic/${clinic_id}/employees`)}>
              <CardContent className="p-4">
                <img src={employee} alt="Employees" className="mx-auto mb-2" />
                <Button className="w-full rounded-md py-1">Employees</Button>
              </CardContent>
            </Card>
            <Card className="text-center cursor-pointer shadow-inner bg-gray-50" onClick={() => navigate(`/clinic/${clinic_id}/patients`)}>
              <CardContent className="p-4">
                <img src={patient} alt="Patients" className="mx-auto mb-2" />
                <Button className="w-full rounded-md py-1">Patients</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </Card>
    );
  };
  
  export default Dashboard;