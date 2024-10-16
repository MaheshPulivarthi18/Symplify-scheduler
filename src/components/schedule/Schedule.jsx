// schedule.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import parse from 'date-fns/parse';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppointmentPopup from './Appointment';
import './Schedule.css'
import '../../index.css'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth, startOfDay, endOfDay, isSameDay, addWeeks, isBefore, setHours, setMinutes } from 'date-fns';
import { Toggle } from '../ui/toggle';
import { Button } from '../ui/button';
import TimePicker from '../ui/timepicker';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { PlusCircle, Search, EyeOff, Eye, X } from "lucide-react";
import { Card } from '../ui/card';
import { useToast } from "@/components/ui/use-toast";
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, addMinutes, addDays, addMonths } from 'date-fns';
import { DatePicker } from '@/components/ui/datepicker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from '@/components/ui/progress';
import ClockPicker from '@/components/ui/clock';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Schedule() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('day');
  const [date, setDate] = useState(new Date());
  // const [isModalOpen, setIsVisitDialogOpen] = useState(false);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    id: null,
    patient: '',
    doctor: '',
    service: '',
    date: new Date(),
    time: new Date(),
    frequency: 'does not repeat',
    duration: 30,
  });
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [showCanceled, setShowCanceled] = useState(false);
  const [calendarStartTime, setCalendarStartTime] = useState(new Date(0, 0, 0, 9, 0));
  const [calendarEndTime, setCalendarEndTime] = useState(new Date(0, 0, 0, 21, 0));
  const [breakStartTime, setBreakStartTime] = useState(new Date(0, 0, 0, 12, 0));
  const [breakEndTime, setBreakEndTime] = useState(new Date(0, 0, 0, 13, 0));
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const {clinic_id} = useParams();
  const { authenticatedFetch } = useAuth()
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [workingHours, setWorkingHours] = useState({});
  const [sellables, setSellables] = useState([]);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newVisit, setNewVisit] = useState({
    patient: '',
    patientName: '',
    sellable: '',
    date: new Date(),
    time: '06:00',
    frequency: 'does_not_repeat',
    weekdays: [],
    endsOn: '',
    sessions: '',
    duration: 30,
    customDuration: '',
    therapist: '',
    therapistName: '',
    attended: false,
  });
  const [showCancelled, setShowCancelled] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [therapistSearch, setTherapistSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [totalScheduled, setTotalScheduled] = useState(0);
  const [totalVisited, setTotalVisited] = useState(0);
  const [totalCancelled, setTotalCancelled] = useState(0);
  const [dateRange, setDateRange] = useState('today');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [bookedVisits, setBookedVisits] = useState([])
  const [visits, setVisits] = useState([])

  const filteredTherapists = therapists.filter(therapist => 
    `${therapist.first_name} ${therapist.last_name}`.toLowerCase().includes(doctorSearch.toLowerCase())
  );
  
  const filteredPatients = patients.filter(patient => 
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
      }, 10);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchTherapists();
    fetchPatients();
    fetchSettings();
    fetchSellables();
    setIsVisible(true);
  }, [clinic_id]);

  // useEffect(() => {
  //   if (patients.length > 0) {
  //     fetchBookings();
  //   }
  // }, [patients]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const [bookings, visitsData] = await Promise.all([fetchBookings(), fetchVisits()]);
        const { formattedVisits, attendedBookingIds } = visitsData;
  
        // Update bookings to mark attended ones
        const updatedBookings = bookings.map(booking => {
          if (attendedBookingIds.has(booking.id)) {
            return { ...booking, attended: true };
          } else {
            return booking;
          }
        });
  
        let allEvents = [...updatedBookings, ...formattedVisits];
        allEvents = allEvents.filter(event => event.status_patient !== 'R' && event.status_employee !== 'R');
        setEvents(allEvents);
        updateAppointmentCounts(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllEvents();
  }, [date, view, clinic_id, selectedDoctorId, dateRange]); 
  
  

  useEffect(() => {
    fetchWorkingHours();
  }, [clinic_id]);

  const fetchWorkingHours = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`);
      if (!response.ok) throw new Error('Failed to fetch working hours');
      const data = await response.json();
      if (data.working_hours) {
        setWorkingHours(data.working_hours);
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
      toast({
        title: "Error",
        description: "Failed to fetch working hours. Some features may not work correctly.",
        variant: "destructive",
      });
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

  const fetchPatients = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/settings/`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data.working_hours) {
        setWorkingHours(data.working_hours);
        
        // Set initial times based on Monday's schedule
        const mondaySchedule = data.working_hours['1'];
        
        setCalendarStartTime(new Date(0, 0, 0, ...mondaySchedule.morning.start.split(':').map(Number)));
        setCalendarEndTime(new Date(0, 0, 0, ...mondaySchedule.afternoon.end.split(':').map(Number)));
        setBreakStartTime(new Date(0, 0, 0, ...mondaySchedule.morning.end.split(':').map(Number)));
        setBreakEndTime(new Date(0, 0, 0, ...mondaySchedule.afternoon.start.split(':').map(Number)));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDateForAPI = (date) => {
    return date.toISOString()
      .replace(/\.\d{3}Z$/, '')
  };

  const fetchBookings = async () => {
    try {
      let viewStart, viewEnd;
  
      if (view === 'day') {
        viewStart = startOfDay(date);
        viewEnd = endOfDay(date);
      } else if (view === 'week') {
        viewStart = startOfWeek(date);
        viewEnd = endOfWeek(date);
      } else if (view === 'month') {
        viewStart = startOfMonth(date);
        viewEnd = endOfMonth(date);
      }
  
      const timeFrom = formatDateForAPI(viewStart);
      const timeTo = formatDateForAPI(viewEnd);
  
      const url = new URL(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/`);
      url.searchParams.append('time_from', timeFrom);
      url.searchParams.append('time_to', timeTo);
  
      if (selectedDoctorId) {
        url.searchParams.append('employee_uuid', selectedDoctorId);
      } else {
        url.searchParams.append('employee_uuid', 'all');
      }
  
      const response = await authenticatedFetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 400) {
          throw new Error("Error fetching bookings");
        }
        const errorData = await response.json();
        throw new Error(errorData || 'Failed to fetch bookings');
      }
  
      const data = await response.json();
  
      let formattedEvents = data.map(booking => ({
        id: booking.id,
        title: `${booking.patient.first_name} ${booking.patient.last_name}`,
        start: new Date(booking.start),
        end: new Date(booking.end),
        patientId: booking.patient.id,
        patientName: `${booking.patient.first_name} ${booking.patient.last_name}`,
        doctorId: booking.employee.id,
        doctorName: `${booking.employee.first_name} ${booking.employee.last_name || ""}`,
        service: booking.sellable,
        resourceId: booking.employee.id,
        status_patient: booking.status_patient,
        status_employee: booking.status_employee,
        recurrence: booking.recurrence,
        attended: booking.attended,
        eventType: 'booking', // Add eventType for consistency
      }));      
      formattedEvents = formattedEvents.filter(event => event.status_patient !== 'R' && event.status_employee !== 'R');
      setEvents(formattedEvents);
      updateAppointmentCounts(formattedEvents);
      setEvents(formattedEvents);
      console.log(formattedEvents)
      return formattedEvents
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch bookings. Please try again.",
        variant: "destructive",
      });
      if (error.message.includes('Authentication failed')) {
        // Handle authentication error (e.g., redirect to login page)
      }
      return []
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientBookings = async (patientId) => {
    try {
      let viewStart, viewEnd;
  
      if (view === 'day') {
        viewStart = startOfDay(date);
        viewEnd = endOfDay(date);
      } else if (view === 'week') {
        viewStart = startOfWeek(date);
        viewEnd = endOfWeek(date);
      } else if (view === 'month') {
        viewStart = startOfMonth(date);
        viewEnd = endOfMonth(date);
      }

      const timeFrom = formatDateForAPI(viewStart);
      const timeTo = formatDateForAPI(viewEnd);
  
      const url = new URL(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patientId}/booking/`);
      url.searchParams.append('time_from', timeFrom);
      url.searchParams.append('time_to', timeTo);
  
      const response = await authenticatedFetch(url.toString());
  
      if (!response.ok) {
        throw new Error('Failed to fetch patient bookings');
      }
  
      const data = await response.json();
  
      const formattedEvents = data.map(booking => ({
        id: booking.id,
        title: `${booking.patient.first_name} ${booking.patient.last_name}`,
        start: new Date(booking.start),
        end: new Date(booking.end),
        patientId: booking.patient.id,
        patientName: `${booking.patient.first_name} ${booking.patient.last_name}`,
        doctorId: booking.employee.id,
        doctorName: `${booking.employee.first_name} ${booking.employee.last_name || ""}`,
        service: booking.sellable,
        resourceId: booking.employee.id,
        status_patient: booking.status_patient,
        status_employee: booking.status_employee,
        recurrence: booking.recurrence,
        attended: booking.attended,
      }));
  
      return formattedEvents;
    } catch (error) {
      console.error('Error fetching patient bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patient bookings. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchSellables = async () => {
    try {
      const data = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/`);
      const sellableData = await data.json()
      // console.log(sellableData)
      setSellables(sellableData);
    } catch (error) {
      console.error("Failed to fetch sellables:", error);
      setSellables([]);
    }
  };  

  const handleReschedule = (event) => {
    const eventDate = new Date(event.start);
    setNewVisit({
      id: event.id,
      patient: event.patientId,
      patientName: event.patient,
      therapist: event.doctorId,
      therapistName: event.doctor,
      sellable: event.service,
      date: isNaN(eventDate) ? new Date() : eventDate,
      time: format(isNaN(eventDate) ? new Date() : eventDate, 'HH:mm'),
      frequency: 'does_not_repeat',
      weekdays: [],
      endsOn: '',
      sessions: '',
      duration: (new Date(event.end) - new Date(event.start)) / (1000 * 60),
      customDuration: '',
      attended: false,
    });
    setIsRescheduling(true);
    setIsVisitDialogOpen(true);
  };
  
  // Then, create a separate function to handle the actual rescheduling
  const submitReschedule = async () => {
    try {
        // Use the date from newVisit.date and combine it with the time
        const [hours, minutes] = newVisit.time.split(':').map(Number);
        const localStartDateTime = new Date(newVisit.date);
        localStartDateTime.setHours(hours, minutes, 0, 0);

        // Calculate the duration in minutes
        const durationInMinutes = newVisit.duration || parseInt(newVisit.customDuration);

        // Calculate end time
        const localEndDateTime = new Date(localStartDateTime.getTime() + durationInMinutes * 60000);

        // Format dates as ISO strings, but remove the 'Z' to keep them as local time
        const formatLocalDate = (date) => date.toISOString().slice(0, -1);
        // console.log(formatLocalDate(localStartDateTime), localEndDateTime, durationInMinutes, newVisit.date, newVisit.time);

        // Convert weekdays to the format expected by the backend (e.g., "MO,TU,WE")
        const weekdayMap = {
          'Mon': 'MO', 'Tue': 'TU', 'Wed': 'WE', 'Thu': 'TH', 'Fri': 'FR', 'Sat': 'SA', 'Sun': 'SU'
        };
        const formattedWeekdays = newVisit.weekdays.map(day => weekdayMap[day]).join(',');
  
        let recurrenceRule = null;
        if (newVisit.frequency === 'weekly') {
          recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${formattedWeekdays}`;
          if (newVisit.endsOn) {
            const endDate = parseISO(newVisit.endsOn);
            // console.log(endDate)
            recurrenceRule += `;UNTIL=${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`;
          } else if (newVisit.sessions) {
            recurrenceRule += `;COUNT=${newVisit.sessions}`;
          }
        }
        const bookingData = {
          start: formatLocalDate(localStartDateTime),
          end: formatLocalDate(localEndDateTime),
          patient: newVisit.patient,
          employee: newVisit.therapist,
          sellable: newVisit.sellable,
          recurrence: recurrenceRule,
          actor: "E",
        };
        // console.log(bookingData, "Rescheduling Appointment");
        const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/${newVisit.id}/reschedule/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },      
          body: JSON.stringify(bookingData),      
        });

        if (!response.ok) throw new Error('Failed to reschedule appointment');
  
        const updatedBooking = await response.json();
        // setEvents(events.map(event => event.id === newVisit.id ? updatedBooking : event));
        await fetchBookings();

        setEvents(prevEvents => prevEvents.map(event => 
          event.id === newVisit.id ? updatedBooking : event
        ));
        setNewVisit({
          patient: '',
          sellable: '',
          date: '',
          time: '',
          frequency: 'does_not_repeat',
          weekdays: [],
          endsOn: '',
          sessions: '',
          duration: 30,
          customDuration: '',
          therapist: '',
          attended: false,
        });
        setIsRescheduling(false);
        setIsVisitDialogOpen(false);
        toast({
          title: "Success",
          description: "Appointment rescheduled successfully.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
      }); 
    }  
  };

  const handleCancel = async (eventToCancel, cancelScope, tillDate = null) => {
    // console.log(eventToCancel);
    try {
      const cancelData = {
        actor: 'E',
        scope: cancelScope,
      };
  
      // Only include till_date if it's provided and scope is 'D'
      if (cancelScope === 'D' && tillDate) {
        cancelData.till_date = tillDate.toISOString();
      }
  
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/${eventToCancel.id}/cancel/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancelData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel appointment');
      }
  
      const canceledAppointment = await response.json();
      
      // Update the local state to reflect the cancellation
      await fetchBookings();
      setEvents(prevEvents => prevEvents.map(event => 
        event.id === canceledAppointment.id 
          ? { ...event, status_patient: 'X', status_employee: 'X' } 
          : event
      ));
  
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: "Appointment(s) cancelled successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (eventToDelete, deleteScope) => {
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/${eventToDelete.id}/delete/`;
      const queryParams = deleteScope === '1' ? `?scope=recurrence` : '';
  
      const response = await authenticatedFetch(`${url}${queryParams}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) throw new Error('Failed to delete appointment');

      await fetchBookings();
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: deleteScope === '1' ? "All recurring appointments deleted successfully." : "Appointment deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkVisit = async (bookingId, visitDetails) => {
    try {
      const bookingEvent = events.find(event => event.id === bookingId);
      console.log(bookingEvent)
      if (!bookingEvent) {
        throw new Error('Booking not found');
      }

      const visitDate = format(new Date(bookingEvent.start), 'yyyy-MM-dd');
      const visitTime = format(new Date(bookingEvent.start), 'HH:mm');

      const visitData = {
        date: visitDate,
        time: visitDetails.visitedTime,
        comment: visitDetails.comment || '',
        employee: bookingEvent.doctorId,
        booking: bookingId,
        sellable_reduce_balance: visitDetails.removeSessionBalance || false,
        sellable: visitDetails.sellable,
        walk_in: visitDetails.walkIn || false,
        penalty: visitDetails.markPenalty || false
      };

      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${bookingEvent.patientId}/visit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark visit');
      }

      const newVisit = await response.json();
      
      // Update the local state to mark the event as attended
      const fetchAllEvents = async () => {
        setLoading(true);
        try {
          const [bookings, visitsData] = await Promise.all([fetchBookings(), fetchVisits()]);
          const { formattedVisits, attendedBookingIds } = visitsData;
  
          const updatedBookings = bookings.map(booking => {
            if (attendedBookingIds.has(booking.id)) {
              return { ...booking, attended: true };
            } else {
              return booking;
            }
          });
  
          let allEvents = [...updatedBookings, ...formattedVisits];
          allEvents = allEvents.filter(event => event.status_patient !== 'R' && event.status_employee !== 'R');
          setEvents(allEvents);
          updateAppointmentCounts(allEvents);
        } catch (error) {
          console.error('Error fetching events:', error);
        } finally {
          setLoading(false);
        }
      };
  
      await fetchAllEvents();
    } catch (error) {
      console.error('Error marking visit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark visit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (bookingId, reason) => {
    try {
      const bookedVisitEvent = bookedVisits.find(event => event.booking === bookingId);
      // console.log(bookedVisitEvent, bookingId, bookedVisits)
      const nonBookedVisit = visits.find(visit => `visit-${visit.id}` === bookingId);
      if (!bookedVisitEvent && !nonBookedVisit) {
        throw new Error('Visit not found');
      }
      const visitEvent = bookedVisitEvent || nonBookedVisit;
      const revokeData = { reason: reason };
  
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/visit/${visitEvent.id}/cancel/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(revokeData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to Revoke visit');
      }
      // Refresh events to include the updated (canceled) visit
      const fetchAllEvents = async () => {
        setLoading(true);
        try {
          const [bookings, visitsData] = await Promise.all([fetchBookings(), fetchVisits()]);
          const { formattedVisits, attendedBookingIds } = visitsData;
  
          const updatedBookings = bookings.map(booking => {
            if (attendedBookingIds.has(booking.id)) {
              return { ...booking, attended: true };
            } else {
              return booking;
            }
          });
  
          let allEvents = [...updatedBookings, ...formattedVisits];
          allEvents = allEvents.filter(event => event.status_patient !== 'R' && event.status_employee !== 'R');
          setEvents(allEvents);
          updateAppointmentCounts(allEvents);
        } catch (error) {
          console.error('Error fetching events:', error);
        } finally {
          setLoading(false);
        }
      };
  
      await fetchAllEvents();
      toast({
        title: "Success",
        description: "Visit revoked successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error revoking visit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke visit. Please try again.",
        variant: "destructive",
      });
    }
  }

  const addVisit = async () => {
    try {
      // Use the date from newVisit.date and combine it with the time
      const [hours, minutes] = newVisit.time.split(':').map(Number);
      const localStartDateTime = new Date(newVisit.date);
      localStartDateTime.setHours(hours, minutes, 0, 0);
      
      // Calculate the duration in minutes
      const durationInMinutes = newVisit.duration || parseInt(newVisit.customDuration);
      
      // Calculate end time
      const localEndDateTime = new Date(localStartDateTime.getTime() + durationInMinutes * 60000);
      
      
      // Format dates as ISO strings, but remove the 'Z' to keep them as local time
      const formatLocalDate = (date) => date.toISOString().slice(0, -1);
      // console.log(formatLocalDate(localStartDateTime), localEndDateTime, durationInMinutes, newVisit.date, newVisit.time);
      
      // Convert weekdays to the format expected by the backend (e.g., "MO,TU,WE")
      const weekdayMap = {
        'Mon': 'MO', 'Tue': 'TU', 'Wed': 'WE', 'Thu': 'TH', 'Fri': 'FR', 'Sat': 'SA', 'Sun': 'SU'
      };
      const formattedWeekdays = newVisit.weekdays.map(day => weekdayMap[day]).join(',');
  
      let recurrenceRule = null;
      if (newVisit.frequency === 'weekly') {
        recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${formattedWeekdays}`;
        if (newVisit.endsOn) {
          const endDate = parseISO(newVisit.endsOn);
          // console.log(endDate)
          recurrenceRule += `;UNTIL=${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`;
        } else if (newVisit.sessions) {
          recurrenceRule += `;COUNT=${newVisit.sessions}`;
        }
      }

      const bookingData = {
        start: formatLocalDate(localStartDateTime),
        end: formatLocalDate(localEndDateTime),
        patient: newVisit.patient,
        employee: newVisit.therapist,
        sellable: newVisit.sellable,
        recurrence: recurrenceRule,
        actor: "E",
      };

      // console.log(bookingData);

      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if(response.status === 400) {
        const errData = await response.json()
        let err
        if(errData.end){
          err = errData.end[0]
          console.log(errData.end[0])
        } else if (errData.patient){
          err = "Patient " + errData.patient[0]
          console.log(err)
        } else if (errData.employee){
          err = "Employee " + errData.employee[0]
        } else if (errData.start){
          err= errData.start[0]
        }
        throw new Error(err)
      }
      // if (!response.ok) {
      //   throw new Error(isRescheduling ? 'Failed to reschedule appointment' : 'Failed to book appointment');
      // }

      const newBooking = await response.json();
      if (isRescheduling) {
        setEvents(events.map(event => event.id === newVisit.id ? newBooking : event));
      } else {
        setEvents([...events, newBooking]);
      }
      await fetchBookings()
      handleDialogOpenChange(false);
      setNewVisit({
        patient: '',
        sellable: '',
        date: '',
        time: '',
        frequency: 'does_not_repeat',
        weekdays: [],
        endsOn: '',
        sessions: '',
        duration: 30,
        customDuration: '',
        therapist: '',
      });
      toast({
        title: "Success",
        description: "Appointment booked successfully.",
        variant: "default",
      });
      setIsVisitDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDialogOpenChange = (open) => {
    setIsVisitDialogOpen(open);
    if (!open) {
      setIsRescheduling(false);
      setNewVisit({
        patient: '',
        patientName: '',
        sellable: '',
        date: new Date(),
        time: '',
        frequency: 'does_not_repeat',
        weekdays: [],
        endsOn: '',
        sessions: '',
        duration: 30,
        customDuration: '',
        therapist: '',
        therapistName: '',
      });
    }
  };

  const handleDoctorFilterChange = (doctorId) => {
    setSelectedDoctorId(prev => {
      const newValue = prev === doctorId ? '' : doctorId;
      if (newValue) {
        const doctor = therapists.find(t => t.id === doctorId);
        setSelectedFilters(prev => [...prev.filter(f => f.type !== 'doctor'), { type: 'doctor', id: doctorId, name: `${doctor.first_name} ${doctor.last_name}` }]);
      } else {
        setSelectedFilters(prev => prev.filter(f => f.type !== 'doctor'));
      }
      return newValue;
    });
    if (doctorId) {
      setView('week');
    }
  };
  
  const handlePatientFilterChange = async (patientId) => {
    setSelectedPatientId(prev => {
      const newValue = prev === patientId ? '' : patientId;
      if (newValue) {
        const patient = patients.find(p => p.id === patientId);
        setSelectedFilters(prev => [...prev.filter(f => f.type !== 'patient'), { type: 'patient', id: patientId, name: `${patient.first_name} ${patient.last_name}` }]);
      } else {
        setSelectedFilters(prev => prev.filter(f => f.type !== 'patient'));
      }
      return newValue;
    });
  
    if (patientId) {
      setView('month');
      const patientBookings = await fetchPatientBookings(patientId);
      setEvents(patientBookings);
    } else {
      // If no patient is selected, fetch all bookings
      fetchBookings();
    }
  };
  
  const handleCancelledToggle = () => {
    setShowCancelled(!showCancelled);
    if (!showCancelled) {
      setSelectedFilters(prev => [...prev, { type: 'cancelled', name: 'Show Cancelled' }]);
      setView('day');
      setSelectedDoctorId('');
      setSelectedPatientId('');
    } else {
      setSelectedFilters(prev => prev.filter(f => f.type !== 'cancelled'));
    }
  };
  
  const removeFilter = (filter) => {
    if (filter.type === 'doctor') {
      setSelectedDoctorId('');
    } else if (filter.type === 'patient') {
      setSelectedPatientId('');
    } else if (filter.type === 'cancelled') {
      setShowCancelled(false);
    }
    setSelectedFilters(prev => prev.filter(f => f !== filter));
  };

  const clearAllFilters = () => {
    setSelectedDoctorId('');
    setSelectedPatientId('');
    setShowCancelled(false);
    setSelectedFilters([]);
  };

  const onCopyRecurringAppointments = async (newAppointment) => {
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAppointment),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        let errorMessage = "Failed to copy recurring appointments.";
        if (errorData.start) {
          errorMessage = errorData.start[0];
        } else if (errorData.end) {
          errorMessage = errorData.end[0];
        }
        throw new Error(errorMessage);
      }
  
      await fetchBookings();
  
      toast({
        title: "Success",
        description: "Recurring appointments copied successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error in onCopyRecurringAppointments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to copy recurring appointments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelect = ({ start, end, resourceId }) => {
    if (isWithinBreakTime(start) || isWithinBreakTime(end)) {
      toast({
        title: "Invalid Selection",
        description: "You cannot schedule appointments during break time.",
        variant: "destructive",
      });
      return;
    }
    setNewVisit(prev => ({ 
      ...prev, 
      date: start,
      time: format(start, 'HH:mm'),
      therapist: resourceId || ''
    }));
    setIsVisitDialogOpen(true);
  };

  const handleSelectEvent = (event) => {
    console.log(event)
    setSelectedEvent(event);
  };

  const getDaySchedule = (date) => {
    const dayIndex = date.getDay().toString();
    console.log(workingHours)
    return workingHours[dayIndex - 1] || workingHours['0']; // Default to Sunday if no schedule found
  };
  
  const updateCalendarTimes = (date) => {
    const schedule = getDaySchedule(date);
    setCalendarStartTime(parseTimeString(schedule.morning.start));
    setCalendarEndTime(parseTimeString(schedule.afternoon.end));
    setBreakStartTime(parseTimeString(schedule.morning.end));
    setBreakEndTime(parseTimeString(schedule.afternoon.start));
  };

  const parseTimeString = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return new Date(0, 0, 0, hours, minutes);
  };

  // const handleNavigate = (newDate) => {
  //   setDate(newDate);
  //   updateCalendarTimes(newDate);
  // };

  const handleNavigate = (newDate) => {
    setDate(newDate);
    updateCalendarTimes(newDate);
  };

  const isWithinBreakTime = (time) => {
    const timeMinutes = time.getHours() * 60 + time.getMinutes();
    const breakStartMinutes = breakStartTime.getHours() * 60 + breakStartTime.getMinutes();
    const breakEndMinutes = breakEndTime.getHours() * 60 + breakEndTime.getMinutes();
    return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
  };

  const getFilteredResources = () => {
    if (view === 'day') {
      // For day view, return all therapists or the selected one
      return selectedDoctorId 
        ? [therapists.find(t => t.id === selectedDoctorId)].filter(Boolean)
        : therapists;
    }
    if (view === 'week' && selectedDoctorId) {
      return [therapists.find(t => t.id === selectedDoctorId)].filter(Boolean);
    }
    return therapists;
  };


  const filteredEvents = events.filter(event => {
    const doctorMatch = !selectedDoctorId || event.resourceId === selectedDoctorId;
    const patientMatch = !selectedPatientId || event.patientId === selectedPatientId;
  
    const isCancelled = event.status_patient === 'X' || event.status_employee === 'X';
    const isVisit = event.eventType === 'visit';
  
    // Include visits and non-cancelled events, or cancelled events if showCancelled is true
    const includeEvent = isVisit || !isCancelled || (isCancelled && showCancelled);
  
    return doctorMatch && patientMatch && includeEvent;
  });  

  const formattedFilteredEvents = filteredEvents.map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: addDays(todayStart, 1), end: addDays(todayEnd, 1) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
    }
  };

  const fetchVisits = async () => {
    try {
      let viewStart, viewEnd;
  
      if (view === 'day') {
        viewStart = startOfDay(date);
        viewEnd = endOfDay(date);
      } else if (view === 'week') {
        viewStart = startOfWeek(date);
        viewEnd = endOfWeek(date);
      } else if (view === 'month') {
        viewStart = startOfMonth(date);
        viewEnd = endOfMonth(date);
      }
  
      const dateFrom = viewStart.toISOString().split("T")[0];
      const dateTo = viewEnd.toISOString().split("T")[0];
  
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/visit/?date_from=${dateFrom}&date_to=${dateTo}`
      );
      const data = await response.json();
      setVisits(data)

      // Create a set to track bookings that have been attended
      const attendedBookingIds = new Set();

      const formattedVisits = []
      const visitsBooked =[]
  
      // Process visits
      data.forEach(visit => {
        if (visit.booking === null) {
          // Unscheduled visit - include in calendar
          const startDateTime = new Date(`${visit.date}T${visit.time}`);
          const durationInMinutes = visit.duration || 30;
          const endDateTime = new Date(startDateTime.getTime() + durationInMinutes * 60000);
          const therapist = therapists.find(t => t.id === visit.employee);
  
          formattedVisits.push({
            id: `visit-${visit.id}`,
            title: `Visit: ${visit.patient.first_name} ${visit.patient.last_name}`,
            start: startDateTime,
            end: endDateTime,
            patientId: visit.patient.id,
            patientName: `${visit.patient.first_name} ${visit.patient.last_name}`,
            doctorId: visit.employee,
            doctorName: therapist ? `${therapist.first_name} ${therapist.last_name || ""}` : " ",
            service: visit.sellable,
            resourceId: visit.employee,
            eventType: 'visit',
            attended: true,
          });
        } else {
          // Scheduled visit - mark the booking as attended
          visitsBooked.push(visit)
          attendedBookingIds.add(visit.booking);
          setBookedVisits(visitsBooked)
        }
      });
  
      return { formattedVisits, attendedBookingIds };
    } catch (error) {
      console.error('Failed to fetch visits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visits. Please try again.",
        variant: "destructive",
      });
      return { formattedVisits: [], attendedBookingIds: new Set() };
    }
  };
  
  

  const updateAppointmentCounts = (events) => {
    let scheduled = 0;
    let visited = 0;
    let cancelled = 0;
  
    events.forEach(event => {
      if (event.eventType === 'visit') {
        visited++;
      } else if (event.status_patient === 'X' || event.status_employee === 'X') {
        cancelled++;
      } else if (event.attended === true) {
        visited++;
        scheduled++;
      } else {
        scheduled++;
      }
    });
  
    setTotalScheduled(scheduled);
    setTotalCancelled(cancelled);
    setTotalVisited(visited);
  };  

  useEffect(() => {
    updateAppointmentCounts(events);
  }, [events]);

  // const formattedFilteredEvents = filteredEvents.map(event => ({
  //   id: event.id,
  //   doctor: event.doctorName,
  //   patient: event.patientName,
  //   service: event.service,
  //   title: event.title,
  //   start: new Date(event.start),
  //   end: new Date(event.end),
  //   resourceId: event.doctorId,
  //   allDay: false,
  //   status_patient: event.status_patient,
  //   status_employee: event.status_employee
  // }));

  const ResourceHeader = ({ label }) => {
    return (
    <div className="resource-header flex flex-row justify-center gap-4 text-center">
      <div className="avatar bg-gray-600">
        {label.charAt(0)}
      </div>
      <span>{label}</span>
    </div>
  );}

  const CustomToolbar = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };
  
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
  
    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };
  
    const label = () => {
      const date = toolbar.date;
      const view = toolbar.view;
  
      if (view === 'month') {
        return format(date, 'MMMM yyyy');
      }
      if (view === 'week') {
        const start = startOfWeek(date);
        const end = endOfWeek(date);
        return `${format(start, 'MMMM d')} - ${format(end, isSameMonth(start, end) ? 'd' : 'MMMM d')}`;
      }
      if (view === 'day') {
        return format(date, 'EEEE, MMMM d');
      }
      return '';
    };
  
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={goToBack} className="rbc-btn rbc-prev-button">
            <i className="fa-solid fa-angle-left"></i>
          </button>
          <button type="button" onClick={goToCurrent} className="rbc-btn rbc-today-button">
            Today
          </button>
          <button type="button" onClick={goToNext} className="rbc-btn rbc-next-button">
            <i className="fa-solid fa-angle-right"></i>
          </button>
        </span>
        <div className="rbc-toolbar-label">{label()} 
        <div className="text-sm mt-1">
          Scheduled: {totalScheduled} | Visited: {totalVisited} | Cancelled: {totalCancelled}
        </div>
        </div>
        <span className="rbc-btn-group">
          {toolbar.views.map(view => (
            <button
              key={view}
              type="button"
              className={`rbc-btn rbc-${view.toLowerCase()}-button ${view === toolbar.view ? 'rbc-active' : ''}`}
              onClick={() => toolbar.onView(view)}
            >
              {view.charAt(0).toUpperCase() + view.substring(1).toLowerCase()}
            </button>
          ))}
        </span>
      </div>
    );
  };

  const TimeSelect = ({ value, onChange }) => {
    const generateTimeOptions = () => {
      const options = [];
      for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
          const hour = i.toString().padStart(2, '0');
          const minute = j.toString().padStart(2, '0');
          const time = `${hour}:${minute}`;
          options.push(<SelectItem key={time} value={time}>{time}</SelectItem>);
        }
      }
      return options;
    };
  
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {generateTimeOptions()}
        </SelectContent>
      </Select>
    );
  };

  const handleTimeChange = (time) => {
    // console.log('Selected time:', time); // Add this for debugging
    setNewVisit(prev => ({ ...prev, time }));
  };

  const SearchableSelect = ({ placeholder, options, value, onValueChange, searchPlaceholder }) => {
    const [search, setSearch] = useState('');
  
    const filteredOptions = options.filter(option =>
      `${option.first_name} ${option.last_name}`.toLowerCase().includes(search.toLowerCase())
    );
  
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="relative mb-2 p-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          {filteredOptions.map(option => (
            <SelectItem key={option.id} value={option.id}>
              {option.first_name} {option.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // if (loading) {
  //   return (
  //     <div className="w-full flex flex-col items-center justify-center">
  //       <Progress value={progress} className="w-[60%]" />
  //       <p className="mt-4 text-sm text-gray-500">Loading schedule... {Math.round(progress)}%</p>
  //     </div>
  //   );
  // }

  const CustomEvent = ({ event }) => {
    let badgeColor = 'transparent';
  
    if (event.eventType === 'visit') {
      badgeColor = '#90EE90'; // Light green for unscheduled visits
    } else if (event.attended) {
      badgeColor = '#116530'; // Dark green for attended bookings
    }
  
    const getFirstName = (fullName) => {
      return fullName && typeof fullName === 'string' ? fullName.split(" ")[0] : '';
    };
  
    let title, doctorName;
  
    if (event.eventType === 'visit') {
      title = `Visit: ${getFirstName(event.patientName)}`;
      doctorName = getFirstName(event.doctorName);
    } else {
      title = event.title && event.title !== ""
        ? `${getFirstName(event.title)} - Dr. `
        : "Untitled";
      doctorName = getFirstName(event.doctorName);
    }
  
    return (
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <div style={{
          height: '14px',
          width: '8%',
          backgroundColor: badgeColor,
          position: 'absolute',
          top: 0,
          right: 0,
        }} />
        <div style={{ padding: '4px 2px'}}>
          {title} {doctorName}
        </div>
      </div>
    );
  };  
  

  return (
    // className={`mx-auto flex flex-col gap-4 p-4 w-full h-full shadow-xl transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
    <Card className={`mx-auto p-4 w-full max-w-[90vw] lg:h-[90vh] shadow-lg transition-all duration-500 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
      <div className='flex flex-col-reverse lg:flex-row-reverse gap-8 lg:gap-8 w-full h-full relative'>
        <div className={`w-full flex flex-col h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:translate-x-0 lg:w-[17.75%]' : 'lg:translate-x-full relative lg:-right-40 lg:w-0 '} `}>
          <div className="mb-4 flex-shrink-0">
            <Button 
              onClick={() => {
                const now = new Date();
                setNewVisit(prev => ({
                  ...prev,
                  date: now,
                  time: format(now, 'HH:mm'),
                }));
                handleDialogOpenChange(true);
              }} 
              className="flex items-center w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          </div>
          <div className="mb-4 flex-shrink-0">
            <div className='flex gap-4 justify-between items-center'>
              <Label htmlFor="startTime">From</Label>
              <ClockPicker
                id="startTime"
                value={format(calendarStartTime, 'HH:mm')}
                onChange={(time) => setCalendarStartTime(parseTimeString(time))}
              />
            </div>
            <div className='flex gap-4 justify-between items-center mt-2'>
              <Label htmlFor="endTime">To</Label>
              <ClockPicker
                id="endTime"
                value={format(calendarEndTime, 'HH:mm')}
                onChange={(time) => setCalendarEndTime(parseTimeString(time))}
              />
            </div>
            <div className='flex gap-4 justify-between items-center mt-2'>
              <Label htmlFor="breakStartTime">Break Start</Label>
              <ClockPicker
                id="breakStartTime"
                value={format(breakStartTime, 'HH:mm')}
                onChange={(time) => setBreakStartTime(parseTimeString(time))}
              />
            </div>
            <div className='flex gap-4 justify-between items-center mt-2'>
              <Label htmlFor="breakEndTime">Break End</Label>
              <ClockPicker
                id="breakEndTime"
                value={format(breakEndTime, 'HH:mm')}
                onChange={(time) => setBreakEndTime(parseTimeString(time))}
              />  
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 p-2">
            {selectedFilters.map((filter, index) => (
              <div key={index} className="bg-primary text-primary-foreground px-3 py-1 rounded-full flex items-center">
                <span>{filter.name}</span>
                <button onClick={() => removeFilter(filter)} className="ml-2">
                  <X size={14} />
                </button>
              </div>
            ))}
            {selectedFilters.length > 0 && (
              <button onClick={clearAllFilters} className="text-sm text-gray-600 hover:text-gray-800">
                Clear all
              </button>
            )}
          </div>
          <ScrollArea className="flex-grow overflow-y-auto pr-4">
            <Toggle
              pressed={!selectedDoctorId && !selectedPatientId}
              onPressedChange={clearAllFilters}
              className="mb-4 w-full"
            >
              {selectedDoctorId === "" && selectedPatientId === "" ? "Apply Filter" : "Clear All Filters" }
            </Toggle>
              <h1 className='font-bold text-lg mb-2'>Doctors</h1>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search doctors..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex flex-col gap-2 mb-4">
                {filteredTherapists.map(therapist => (
                  <Toggle
                    key={therapist.id}
                    pressed={selectedDoctorId === therapist.id}
                    onPressedChange={() => handleDoctorFilterChange(therapist.id)}
                  >
                    {therapist.first_name} {therapist.last_name}
                  </Toggle>
                ))}
              </div>

              <h1 className='font-bold text-lg mb-2'>Patients</h1>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search patients..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex flex-col gap-2 mb-4">
                {filteredPatients.map(patient => (
                  <Toggle
                    key={patient.id}
                    pressed={selectedPatientId === patient.id}
                    onPressedChange={() => handlePatientFilterChange(patient.id)}
                  >
                    {patient.first_name} {patient.last_name}
                  </Toggle>
                ))}
              </div>


            <Toggle 
            pressed={showCancelled} 
            onPressedChange={handleCancelledToggle} 
            className="w-full"
            >
              {showCancelled ? "Hide Cancelled" : "View Cancelled"}
            </Toggle>
          </ScrollArea>
        </div>
          <button 
            onClick={toggleSidebar}
            className="absolute top-5 right-0 transform -translate-y-1/2 bg-secondary p-2 rounded-full"
          >
            {isSidebarOpen ? <EyeOff /> : <Eye /> }
            
          </button>
        <div className={`bg-white rounded-lg shadow-lg transition-all duration-300 ease-in-out flex-grow ${isSidebarOpen ? 'w-[80%]' : 'w-[90%]'}`}>
          <Calendar
            localizer={localizer}
            events={formattedFilteredEvents}
            startAccessor="start"
            endAccessor="end"
            defaultView={"day"}
            views={["day", "week", "month"]}
            selectable
            resources={getFilteredResources().map(therapist => ({
              id: therapist.id,
              title: `${therapist.first_name} ${therapist.last_name === null ? "" : therapist.last_name}`
            }))}
            resourceIdAccessor="id"
            resourceTitleAccessor="title"
            onSelectSlot={handleSelect}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={(newView) => {
              setView(newView);
              setDateRange(newView)
            }}
            date={date}
            // onNavigate={setDate}
            className="font-sans h-full"
            style={{ height: '100%' }}
            components={{
              toolbar: CustomToolbar,
              resourceHeader: ResourceHeader,
              event: CustomEvent,  // Add this line
            }}
            formats={{
              monthHeaderFormat: (date, culture, localizer) =>
                localizer.format(date, 'MMMM yyyy', culture),
              dayFormat: 'dd',
              dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                `${localizer.format(start, 'MMMM dd', culture)} - ${localizer.format(end, 'MMMM dd', culture)}`
            }}
            min={calendarStartTime}
            max={calendarEndTime}
            onNavigate={handleNavigate}
            eventPropGetter={(event) => {
              let style = {
                backgroundColor: event.eventType === 'visit' ? '#90EE90' : '#7EC8E3',
                color: 'black',
                height: '100%',
              };

              if (event.status_patient === 'X' || event.status_employee === 'X') {
                style.backgroundColor = 'lightgrey';
                style.color = 'darkgrey';
              }

              return { style };
            }}
            dayPropGetter={(date) => ({
              style: {
                backgroundColor: 'white',
              },
            })}
            slotPropGetter={(date) => {
              if (isWithinBreakTime(date)) {
                return {
                  style: {
                    backgroundColor: '#f0f0f0',
                    pointerEvents: 'none',
                    cursor: 'not-allowed',
                  }
                };
              }
              return {};
            }}
          />
        </div>
      </div>

      {selectedEvent && (
        <AppointmentPopup 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onMarkVisit={handleMarkVisit}
          onRevoke={handleRevoke}
          sellables={sellables}  // Pass sellables to AppointmentPopup
          onCopyRecurringAppointments={onCopyRecurringAppointments}
          workingHours={workingHours}
        />
      )}
      {/* add appointment */}
      <Dialog open={isVisitDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          {/* {console.log("Dialog rendering with date:", newVisit.date)} */}
          <DialogHeader>
            <DialogTitle>{isRescheduling ? 'Reschedule Appointment' : 'Add Appointment'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isRescheduling ? (
              <>
                <SearchableSelect
                  placeholder="Select Therapist"
                  options={therapists}
                  value={newVisit.therapist}
                  onValueChange={(value) => setNewVisit({...newVisit, therapist: value})}
                  searchPlaceholder="Search therapists..."
                />
                <div>
                  <Label>{format(new Date(newVisit.date), 'EEEE dd MMMM yyyy')} - {newVisit.time}</Label>
                </div>
              </>
            ) : (
              <>
              <SearchableSelect
                placeholder="Select Patient"
                options={patients}
                value={newVisit.patient}
                onValueChange={(value) => setNewVisit({...newVisit, patient: value})}
                searchPlaceholder="Search patients..."
              />

              <SearchableSelect
                placeholder="Select Therapist"
                options={therapists}
                value={newVisit.therapist}
                onValueChange={(value) => setNewVisit({...newVisit, therapist: value})}
                searchPlaceholder="Search therapists..."
              />
              </>
            )}

            <Select 
              value={newVisit.sellable} 
              onValueChange={(value) => setNewVisit({...newVisit, sellable: value})}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Product / Service" />
              </SelectTrigger>
              <SelectContent>
                {sellables.map(sellable => (
                  <SelectItem key={sellable.id} value={sellable.id}>
                    {sellable.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <Label htmlFor="date">{isRescheduling ? ("Reschedule To") : ("Starts On")}</Label>
                  <DatePicker
                    id="date"
                    selected={newVisit.date}
                    value={newVisit.date}
                    onChange={(date) => {setNewVisit({...newVisit, date: date});}}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  {/* <TimeSelect
                    id="time"
                    value={newVisit.time}
                    onChange={(time) => {setNewVisit({...newVisit, time: time}); console.log(newVisit.time)}}
                  /> */}
                  <ClockPicker
                    id="time"
                    value={newVisit.time}
                    onChange={(time) => {setNewVisit({...newVisit, time: time});}}
                  />
                </div>
              </div>
            </div>
            {isRescheduling ? (
              <>

              </>
            ) : (
              <>
                <Select onValueChange={(value) => setNewVisit({...newVisit, frequency: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="does_not_repeat">Does not repeat</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>

                {newVisit.frequency === 'weekly' && (
                  <>
                    <div>
                      <Label className="mb-2 block">Select Weekdays</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <Button
                            key={day}
                            variant={newVisit.weekdays.includes(day) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const updatedWeekdays = newVisit.weekdays.includes(day)
                                ? newVisit.weekdays.filter(d => d !== day)
                                : [...newVisit.weekdays, day];
                              setNewVisit({...newVisit, weekdays: updatedWeekdays});
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ends On (DD/MM/YYYY)</Label>
                      <DatePicker
                        id="enddate"
                        selected={date}
                        onChange={(date) => setNewVisit({...newVisit, endsOn: date ? date.toISOString().split('T')[0] : ''})}
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sessions">OR</Label>
                      <Input
                        id="sessions"
                        type="number"
                        placeholder="For next 'X' sessions"
                        value={newVisit.sessions}
                        onChange={(e) => setNewVisit({...newVisit, sessions: e.target.value})}
                      />
                    </div>
                  </>
                )}

              </>
            )}
            
            <div className="space-y-2">
              <Label>Duration</Label>
              <RadioGroup onValueChange={(value) => setNewVisit({...newVisit, duration: parseInt(value), customDuration: ''})}>
                <div className="flex flex-wrap gap-2">
                  {[30, 45, 60, 90].map((duration) => (
                    <div key={duration} className="flex items-center space-x-2">
                      <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                      <Label htmlFor={`duration-${duration}`}>{duration} Mins</Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="duration-custom" />
                    <Label htmlFor="duration-custom">Custom</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {newVisit.duration === 0 && (
              <Input
                type="number"
                placeholder="Custom Duration in mins"
                value={newVisit.customDuration}
                onChange={(e) => setNewVisit({...newVisit, customDuration: e.target.value})}
              />
            )}
          </div>
          <Button onClick={isRescheduling ? submitReschedule : addVisit} className="w-full">
            {isRescheduling ? 'Reschedule Appointment' : 'Book Appointment'}
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}