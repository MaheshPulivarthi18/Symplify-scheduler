// PatientProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Check, FileDownIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/datepicker';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
// import { Clock as Clock } from "@/components/ui/clock"
import ClockPicker from "@/components/ui/clock"
import { parseISO, format, addMinutes, addHours, addDays, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns';
import { CalendarIcon, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { date } from 'zod';
import { MoreVertical, FileText, Phone, Mail, Edit, FileDown, Trash2Icon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
// import { } from "lucide-react"
//  import { format, parseISO } from 'date-fns'
import { ArrowUpDown } from "lucide-react"
// import { excel}
import ExcelJS from 'exceljs';
import { InvoiceDialog, InvoiceDetailsDialog, InvoiceStatusDialog } from '../payments/GenarateInvoice';
import { Filter } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import TherapistCountsDialog from './TherapistCounts';
import VisitCountsDialog from './VisitCountsDialog';
import SellableCountsDialog from './SellableCount';
import { countryCodes } from '@/lib/countryCodes';
import axios from 'axios';

const PatientProfile = () => {
  const { clinic_id, patient_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    // ... other form fields
    country_code: '',
    mobile: '',
  });
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [sellables, setSellables] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [sellableDetails, setSellableDetails] = useState({});
  const [paymentadd,setpaymentadd]=useState(false);
  const [progress, setProgress] = useState(0);
  const [newNote, setNewNote] = useState({ description: '', visible_to_patient: false });
  const [newGoal, setNewGoal] = useState({ title: '', description: '', complete_by: '' });
  const [newTask, setNewTask] = useState({ name: '', description: '', repetitions: 0, goal: '' });
  const [newAppointment, setNewAppointment] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    employee: '',
    sellable: '',
    duration: 30,
    frequency: 'does_not_repeat',
    weekdays: [],
    endsOn: '',
    sessions: '',
  });

  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [openNoteDialogs, setOpenNoteDialogs] = useState({});
  const [openGoalDialogs, setOpenGoalDialogs] = useState({});

  const [visits, setVisits] = useState([]);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [newVisit, setNewVisit] = useState({
    date: new Date(), // Initialize with current date
    time: '',
    comment: '',
    employee: '',
    sellable: '',
    sellable_reduce_balance: false,
    walk_in: false,
    penalty: false,
    duration: 30
  });
  const [allVisits, setAllVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [isVisitCountsDialogOpen, setIsVisitCountsDialogOpen] = useState(false);
  const [isSellableCountsDialogOpen, setIsSellableCountsDialogOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentChannels, setPaymentChannels] = useState([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount_paid: '',
    amount_refunded: '0',
    date: new Date().toISOString().split('T')[0],
    channel: ''
  });
  const [invoices, setInvoices] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ from: new Date(), to: new Date() });
  const [isTherapistCountsDialogOpen, setIsTherapistCountsDialogOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isConfirmingInvoice, setIsConfirmingInvoice] = useState(false);

  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false);
  const [uploadingNoteId, setUploadingNoteId] = useState(null);
  const [fileDetails, setFileDetails] = useState(null)

  const [imageViewerUrl, setImageViewerUrl] = useState(null);
  const dateRangeOptions = {
    'all': 'All',
    'today': 'Today',
    'yesterday': 'Yesterday',
    'thisWeek': 'This Week',
    'thisMonth': 'This Month',
    'thisYear': 'This Year',
    'custom': 'Custom Range',
  };
  const dateRangeDisplay = dateRangeOptions[dateRange];


  const openImageViewer = (url) => {
    setImageViewerUrl(url);
  };

  const closeImageViewer = () => {
    setImageViewerUrl(null);
  };

  const fetchLedgerTransactions = async () => {
    setLedgerLoading(true);
    try {
      const response = await fetchWithTokenHandling(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/ledger/`
      );
  
      // Process transactions to parse amounts and combine entries where needed
      const transactionMap = {};
      const processedTransactions = [];
      const invoiceIds = new Set();
  
      response.forEach((transaction, index) => {
        const transactionKey = transaction.invoice || transaction.payment || `unknown-${index}`;
  
        if (transaction.invoice) {
          invoiceIds.add(transaction.invoice);
  
          if (!transactionMap[transaction.invoice]) {
            transactionMap[transaction.invoice] = [];
          }
          transactionMap[transaction.invoice].push({ transaction, index });
        } else {
          // For payments and other transactions, process directly
          processedTransactions.push({
            ...transaction,
            amount_credit: parseFloat(transaction.amount_credit) || 0,
            amount_debit: parseFloat(transaction.amount_debit) || 0,
            balance: parseFloat(transaction.balance) || 0,
            transactionType:
              transaction.transaction === 'p' ? 'Payment' : 'Unknown',
            index,
          });
        }
      });
  
      // Fetch invoice details to get invoice numbers
      const invoiceIdArray = Array.from(invoiceIds);
      const invoiceDetailsMap = {};
  
      // Fetch invoice details in parallel
      await Promise.all(
        invoiceIdArray.map(async (invoiceId) => {
          try {
            const invoiceDetail = await fetchWithTokenHandling(
              `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/invoice/${invoiceId}/`
            );
            invoiceDetailsMap[invoiceId] = invoiceDetail.number;
          } catch (error) {
            console.error(`Failed to fetch invoice ${invoiceId}:`, error);
            invoiceDetailsMap[invoiceId] = 'Unknown';
          }
        })
      );
  
      // Now process invoice entries
      Object.values(transactionMap).forEach((entries) => {
        if (entries.length === 1) {
          const { transaction, index } = entries[0];
          // Single transaction, either invoice or cancellation without matching pair
          let transactionType = '';
          if (transaction.transaction === 'i') {
            transactionType = 'Invoice';
          } else if (transaction.transaction === 'c') {
            transactionType = 'Cancellation';
          } else {
            transactionType = 'Unknown';
          }
  
          processedTransactions.push({
            ...transaction,
            amount_credit: parseFloat(transaction.amount_credit) || 0,
            amount_debit: parseFloat(transaction.amount_debit) || 0,
            balance: parseFloat(transaction.balance) || 0,
            transactionType,
            invoiceNumber: invoiceDetailsMap[transaction.invoice] || 'Unknown',
            index,
          });
        } else if (entries.length === 2) {
          // Possible invoice and its cancellation
          const invoiceEntry = entries.find(e => e.transaction.transaction === 'i');
          const cancellationEntry = entries.find(e => e.transaction.transaction === 'c');
  
          if (invoiceEntry && cancellationEntry) {
            // Combine them into one entry
            processedTransactions.push({
              date: cancellationEntry.transaction.date,
              transactionType: 'Cancellation',
              amount_debit: parseFloat(invoiceEntry.transaction.amount_debit) || 0,
              amount_credit: parseFloat(cancellationEntry.transaction.amount_credit) || 0,
              balance: parseFloat(cancellationEntry.transaction.balance) || 0,
              invoice: invoiceEntry.transaction.invoice,
              invoiceNumber: invoiceDetailsMap[invoiceEntry.transaction.invoice] || 'Unknown',
              index: cancellationEntry.index, // Use index of cancellation for ordering
            });
          } else {
            // Should not happen, but process individually if it does
            entries.forEach(({ transaction, index }) => {
              let transactionType = '';
              if (transaction.transaction === 'i') {
                transactionType = 'Invoice';
              } else if (transaction.transaction === 'c') {
                transactionType = 'Cancellation';
              } else {
                transactionType = 'Unknown';
              }
  
              processedTransactions.push({
                ...transaction,
                amount_credit: parseFloat(transaction.amount_credit) || 0,
                amount_debit: parseFloat(transaction.amount_debit) || 0,
                balance: parseFloat(transaction.balance) || 0,
                transactionType,
                invoiceNumber: invoiceDetailsMap[transaction.invoice] || 'Unknown',
                index,
              });
            });
          }
        } else {
          // More than 2 entries with same invoice ID, process individually
          entries.forEach(({ transaction, index }) => {
            let transactionType = '';
            if (transaction.transaction === 'i') {
              transactionType = 'Invoice';
            } else if (transaction.transaction === 'c') {
              transactionType = 'Cancellation';
            } else {
              transactionType = 'Unknown';
            }
  
            processedTransactions.push({
              ...transaction,
              amount_credit: parseFloat(transaction.amount_credit) || 0,
              amount_debit: parseFloat(transaction.amount_debit) || 0,
              balance: parseFloat(transaction.balance) || 0,
              transactionType,
              invoiceNumber: invoiceDetailsMap[transaction.invoice] || 'Unknown',
              index,
            });
          });
        }
      });
  
      // Now sort the processed transactions based on the original order
      processedTransactions.sort((a, b) => a.index - b.index);
  
      setLedgerTransactions(processedTransactions);
    } catch (error) {
      console.error('Failed to fetch ledger transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ledger transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLedgerLoading(false);
    }
  };
  

  useEffect(() => {
    fetchLedgerTransactions();
  }, [clinic_id, patient_id]);

  const LedgerTable = ({ data }) => {
    const columns = [
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(parseISO(row.getValue('date')), 'dd/MM/yyyy'),
      },
      {
        accessorKey: 'transactionType',
        header: 'Transaction',
        cell: ({ row }) => {
          const transactionType = row.getValue('transactionType');
          const invoiceNumber = row.original.invoiceNumber;
          if (
            transactionType === 'Invoice' ||
            transactionType === 'Cancellation'
          ) {
            return (
              <div className="flex items-center">
                <Button
                  variant="link"
                  onClick={() => handleViewInvoice(row.original.invoice)}
                >
                  {`${transactionType} ${invoiceNumber}`}
                </Button>
                {transactionType === 'Cancellation' && (
                  <Badge variant="destructive" className="ml-2">
                    Canceled
                  </Badge>
                )}
              </div>
            );
          } else {
            return (
              <div className="flex items-center">
                <span className="px-4">{transactionType}</span>
              </div>
            );
          }
        },
      },
      {
        accessorKey: 'amount_credit',
        header: 'Amount Paid',
        cell: ({ row }) => (
          <Badge
            variant={row.getValue('amount_credit') > 0 ? 'success' : 'default'}
          >
            {row.getValue('amount_credit').toFixed(2)}
          </Badge>
        ),
      },
      {
        accessorKey: 'amount_debit',
        header: 'Invoiced Amount',
        cell: ({ row }) => (
          <Badge
            variant={row.getValue('amount_debit') > 0 ? 'destructive' : 'default'}
          >
            {row.getValue('amount_debit').toFixed(2)}
          </Badge>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => row.getValue('balance').toFixed(2),
      },
    ];
  
    return (
      <DataTable
        columns={columns}
        data={data}
        searchableColumns={[
          {
            id: 'transactionType',
            title: 'Transaction',
          },
        ]}
        rowsPerPage={5}
      />
    );
  };
  
  
  // Visits DataTable
  const VisitsDataTable = ({ data }) => {
    const columns = [
      {
        accessorKey: "date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => format(parseISO(row.getValue("date")), 'EEEE dd MMMM yyyy'),
      },
      {
        accessorKey: "time",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Time
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
      },
      {
        accessorKey: "doctor",
        header: "Doctor",
        cell: ({ row }) => row.getValue("doctor"),
      },
      {
        accessorKey: "service",
        header: "Service",
        cell: ({ row }) => row.getValue("service"),
      },
      {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => `${row.getValue("duration")} minutes`,
      },
      {
        accessorKey: "walk_in",
        header: "Walk-in",
        cell: ({ row }) => row.getValue("walk_in") ? "Yes" : "No",
      },
      {
        accessorKey: "penalty",
        header: "Penalty",
        cell: ({ row }) => row.getValue("penalty") ? "Yes" : "No",
      },
    ];
  
    // Preprocess the data to include doctor and service names
    const processedData = data.map(visit => ({
      ...visit,
      doctor: employeeDetails[visit.employee] 
        ? `${employeeDetails[visit.employee].first_name} ${employeeDetails[visit.employee].last_name}`
        : 'Inactive Therapist',
      service: sellableDetails[visit.sellable]
        ? sellableDetails[visit.sellable].name
        : 'N/A',
    }));
  
    return (
      <DataTable
        columns={columns}
        data={processedData}
        searchableColumns={[
          {
            id: "doctor",
            title: "Doctor",
          },
        ]}
        rowsPerPage={7}
      />
    );
  };

// Appointments DataTable
const AppointmentsDataTable = ({ data }) => {
  const columns = [
    {
      accessorKey: "therapist",
      header: "Therapist",
      cell: ({ row }) => {
        const employeeId = row.original.employee;
        return employeeDetails[employeeId] 
          ? `${employeeDetails[employeeId].first_name} ${employeeDetails[employeeId].last_name}`
          : row.original.employee.first_name + " " + row.original.employee.last_name;
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => format(parseISO(row.getValue("date")), 'EEEE dd MMMM yyyy'),
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Start Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => format(parseISO(row.getValue("startTime")), 'HH:mm'),
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => format(parseISO(row.getValue("endTime")), 'HH:mm'),
    },
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ row }) => {
        const sellableId = row.original.sellable;
        return sellableDetails[sellableId]
          ? sellableDetails[sellableId].name
          : "-";
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data.map(appointment => ({
        ...appointment,
        date: appointment.start,
        startTime: appointment.start,
        endTime: appointment.end,
        therapist: `${appointment.employee.first_name} ${appointment.employee.last_name}`,
      }))}
      searchableColumns={[
        {
          id: "therapist",
          title: "Therapist",
        },
      ]}
      rowsPerPage={7}
    />
  );
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
      }, 70);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const fetchWithTokenHandling = async (url, options = {}) => {
    try {
      const response = await authenticatedFetch(url, options);
      if (response.status === 204) {
        return response;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An error occurred');
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Token is blacklisted' || error.message === 'Token is invalid or expired') {
        navigate('/login');
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  };

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/`);
      setPatient(data);
      
      // Extract country code and mobile number
      const { country_code, mobile } = extractCountryCodeAndMobile(data.mobile);
      
      setFormData({
        ...data,
        country_code,
        mobile,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractCountryCodeAndMobile = (fullMobile) => {
    // Remove any non-digit characters except the leading '+'
    const cleanedNumber = fullMobile.replace(/[^\d+]/g, '');
    
    // Check if the number starts with a '+'
    if (cleanedNumber.startsWith('+')) {
      // Find the country code
      for (let i = 1; i <= 4; i++) {
        const potentialCode = cleanedNumber.substring(0, i + 1);
        if (countryCodes.some(code => code.code === potentialCode)) {
          return {
            country_code: potentialCode,
            mobile: cleanedNumber.substring(i + 1)
          };
        }
      }
    }
    
    // If no valid country code found or number doesn't start with '+',
    // assume it's a local number (India in this case)
    return {
      country_code: '+91',
      mobile: cleanedNumber.startsWith('91') ? cleanedNumber.substring(2) : cleanedNumber
    };
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedPatientData = {
        ...formData,
        mobile: `${formData.country_code}${formData.mobile}`,
      };
      const updatedPatient = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPatientData),
      });
      setPatient(updatedPatient);
      setIsEditing(false);
      toast({ title: "Success", description: "Patient information updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // const fetchNotes = async () => {
  //   try {
  //     const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/`);
  //     setNotes(data);
  //   } catch (error) {
  //     console.error("Failed to fetch notes:", error);
  //     setNotes([]);
  //   }
  // };

  const fetchGoals = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/goal/`);
      setGoals(data);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      setGoals([]);
    }
  };

  const fetchFileDetails = async (noteId, fileId) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${noteId}/file/${fileId}`);
      setFileDetails(prevDetails => ({
        ...prevDetails,
        [fileId]: data
      }));
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
    }
  };

  const fetchNoteDetails = async (noteId) => {
    try {
      setFileDetails(null);
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${noteId}/`);
      const fileData = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${noteId}/file`);
      const fileIds = new Set(fileData.map(file => file.id).filter(Boolean));
      const fetchFiles = Array.from(fileIds).map(fileId => fetchFileDetails(noteId, fileId));
      await Promise.all([...fetchFiles]);
      setSelectedNote(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch note details.",
        variant: "destructive",
      });
    }
  };

  const fetchGoalDetails = async (goalId) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/goal/${goalId}/`);
      setSelectedGoal(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch goal details.",
        variant: "destructive",
      });
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/payment/`);
      setPayments(data);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    }
  };
  
  const fetchPaymentChannels = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/payment/channel/`);
      setPaymentChannels(data);
    } catch (error) {
      console.error("Failed to fetch payment channels:", error);
      setPaymentChannels([]);
    }
  };

  const updateNote = async (noteId, updatedData) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${noteId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      setSelectedNote(data);
      fetchNotes(); // Refresh the notes list
      toast({ title: "Success", description: "Note updated successfully" });
      setOpenNoteDialogs(prev => ({ ...prev, [noteId]: false })); // Close the specific dialog
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateGoal = async (goalId, updatedData) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/goal/${goalId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      setSelectedGoal(data);
      fetchGoals(); // Refresh the goals list
      toast({ title: "Success", description: "Goal updated successfully" });
      setOpenGoalDialogs(prev => ({ ...prev, [goalId]: false })); // Close the specific dialog
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  
  const fetchBookings = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/booking/`);
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setAppointments([]);
    }
  };

  const fetchSellables = async () => {
    try {
      const data = await fetchWithTokenHandling(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/`
      );
      setSellables(data);

      // Populate sellableDetails as an object with sellable IDs as keys
      const details = {};
      data.forEach((sellable) => {
        details[sellable.id] = sellable;
      });
      setSellableDetails(details);
    } catch (error) {
      console.error("Failed to fetch sellables:", error);
      setSellables([]);
    }
  };


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    // setSelectedFile(file);
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      toast({ title: "Error", description: "Please select a valid image file.", variant: "destructive" });
      event.target.value = null; // Reset the input
    }
  };

  const uploadFile = useCallback(async (noteId) => {
    if (!selectedFile) {
      toast({ title: "Error", description: "Please select a file to upload.", variant: "destructive" });
      return false;
    }
  
    try {
      console.log("Requesting presigned URL...");
      const presignedUrlResponse = await fetchWithTokenHandling(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${noteId}/file/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: selectedFile.name }),
        }
      );
  
      const { id: fileId, file: presignedUrl } = presignedUrlResponse;
      console.log("Presigned URL received:", presignedUrl);
  
      console.log("Uploading file...");
      // const formData = new FormData();
      // formData.append('file', selectedFile);
      console.log(selectedFile)
  
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          'Content-Type': "multipart/form-data",
          'Content-Length': selectedFile.size,
          "x-amz-acl": "public-read" 
        },
      });
  
      console.log("File uploaded successfully. Marking as completed...");
      await fetchWithTokenHandling(
        `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${noteId}/file/${fileId}/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        }
      );
  
      console.log("File upload process completed successfully.");
      toast({ title: "Success", description: "File uploaded successfully" });
      setSelectedFile(null);
      return true;
    } catch (error) {
      console.error("Error in uploadFile:", error);
      if (error.message.includes('CORS')) {
        toast({ 
          title: "Error", 
          description: "Unable to upload file due to a CORS error. Please contact the system administrator.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: `File upload failed: ${error.message}`, variant: "destructive" });
      }
      return false;
    }
  }, [selectedFile, clinic_id, patient_id, fetchWithTokenHandling, authenticatedFetch, toast]);

  const handleDownloadFile = (file) => {
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDeleteFile = async (file) => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      try {
        const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${selectedNote.id}/file/${file.id}/`, {
          method: 'DELETE',
        });
        
        if (response.ok) {  // Check if status is in the range 200-299
          toast({ title: "Success", description: "File deleted successfully" });
          // Remove the file from fileDetails
          setFileDetails(prevDetails => {
            const newDetails = { ...prevDetails };
            delete newDetails[file.id];
            return newDetails;
          });
          // Refresh the note details
          fetchNoteDetails(selectedNote.id);
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        toast({ title: "Error", description: `Failed to delete file: ${error.message}`, variant: "destructive" });
      }
    }
  };

  const addNote = async () => {
    try {
      console.log("Adding new note...");
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      });
      console.log("Note added successfully:", response);

      let updatedNote = response;

      if (selectedFile) {
        console.log("Uploading file for the new note...");
        const uploadSuccess = await uploadFile(response.id);
        if (uploadSuccess) {
          console.log("File uploaded successfully. Fetching updated note details...");
          const updatedNoteResponse = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/${response.id}/`);
          updatedNote = updatedNoteResponse;
        }
      }

      setNotes(prevNotes => [...prevNotes, updatedNote]);
      setNewNote({ description: '', visible_to_patient: false });
      toast({ title: "Success", description: "Note added successfully" });
      setIsNoteDialogOpen(false);

      console.log("Fetching all notes...");
      await fetchNotes();
    } catch (error) {
      console.error("Error in addNote:", error);
      toast({ title: "Error", description: `Failed to add note: ${error.message}`, variant: "destructive" });
    }
  };

  const fetchNotes = async () => {
    try {
      console.log("Fetching notes...");
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/note/`);
      console.log("Notes fetched successfully:", data);
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast({ title: "Error", description: `Failed to fetch notes: ${error.message}`, variant: "destructive" });
      setNotes([]);
    }
  };

  // Modify the notes rendering to include file information
  const renderNotes = () => {
    return (
      <div>
        {Object.values(fileDetails).map(file => (
          <div key={file.id} className="p-2 bg-gray-100 rounded mb-2">
            <div className="flex justify-between items-center mb-2">
              <p>{file.name}</p>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Download"
                >
                  <a href={file.file} target="_blank" rel="noopener noreferrer"> <FileDownIcon className="h-4 w-4" /> </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFile(file)}
                  title="Delete"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <img src={file.file} alt={file.name} className="max-w-full max-h-[80vh] object-contain" />
          </div>
        ))}
      </div>
    );
  };
  

  const addGoal = async () => {
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/goal/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGoal),
      });
      setGoals([...goals, response]);
      setNewGoal({ title: '', description: '', complete_by: '' });
      toast({ title: "Success", description: "Goal added successfully" });
      setIsGoalDialogOpen(false); // Close the dialog
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const addTask = async () => {
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/task/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });
      setTasks([...tasks, response]);
      setNewTask({ name: '', description: '', repetitions: 0, goal: '' });
      toast({ title: "Success", description: "Task added successfully" });
      fetchTasks();
      setIsTaskDialogOpen(false); // Close the dialog
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/task/`);
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/visit/`);
      setVisits(response);
      setFilteredVisits(response);

      // Fetch employee and sellable details
      const employeeIds = new Set(response.map(visit => visit.employee).filter(Boolean));
      const sellableIds = new Set(response.map(visit => visit.sellable).filter(Boolean));

      const fetchEmployeePromises = Array.from(employeeIds).map(id => fetchEmployeeDetails(id));
      const fetchSellablePromises = Array.from(sellableIds).map(id => fetchSellableDetails(id));

      await Promise.all([...fetchEmployeePromises, ...fetchSellablePromises]);

    } catch (error) {
      console.error("Failed to fetch visits:", error);
      setVisits([]);
      setFilteredVisits([]);
    }
  };

  const filterVisits = () => {
    if (dateRange === 'all') {
      setFilteredVisits(visits);
      return;
    }

    const { start, end } = getDateRange();
    const filtered = visits.filter(visit => {
      const visitDate = new Date(visit.date);
      return visitDate >= start && visitDate <= end;
    });
    setFilteredVisits(filtered);
  };

  useEffect(() => {
    filterVisits();
  }, [dateRange, customDateRange, visits]);

  const completeTask = async (taskId) => {
    try {
      await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/pat/clinic/${clinic_id}/patient/me/task/${taskId}/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: taskId }),
      });
      fetchTasks(); // Refresh the tasks list
      toast({ title: "Success", description: "Task marked as completed" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fetchTherapists = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/`);
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

  const createBooking = async (bookingData) => {
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/schedule/booking/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      return response;
    } catch (error) {
      throw new Error(`Error creating booking: ${error.message}`);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'all':
        return { start: "", end: ""};
      case 'thisWeek':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'thisYear':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: customDateRange.from ? new Date(customDateRange.from.setHours(0, 0, 0, 0)) : new Date(now.setHours(0, 0, 0, 0)), 
          end: customDateRange.to ? new Date(customDateRange.to.setHours(23, 59, 59, 999)) : new Date(now.setHours(23, 59, 59, 999)) 
        };
      default:
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
    }
  };

  const fetchAppointments = async () => {
    try {
      const { start, end } = getDateRange();
      let response;
      if (start === "") {
        response = await fetchWithTokenHandling(
          `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/booking`
        );
      } else {
        response = await fetchWithTokenHandling(
          `${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/booking/?time_from=${start.toISOString().replace(/\.\d{3}Z$/, "")}&time_to=${end.toISOString().replace(/\.\d{3}Z$/, "")}`
        );
      }
      setAppointments(response);
  
      const sellableIds = new Set(
        response.map((appointment) => appointment.sellable).filter(Boolean)
      );
  
      const missingSellableIds = Array.from(sellableIds).filter(
        (id) => !sellableDetails[id]
      );
      const fetchPromises = missingSellableIds.map((id) =>
        fetchSellableDetails(id)
      );
  
      await Promise.all(fetchPromises);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateRange, customDateRange]);
  
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      console.log("New Appointment Data:", newAppointment);
  
      // Validate time format (HH:mm)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(newAppointment.time)) {
        throw new Error("Invalid time format");
      }
  
      // Validate date format
      if (!newAppointment.date) {
        throw new Error("Invalid date");
      }
  
      // Combine date and time into a Date object
      const dateTimeString = `${newAppointment.date}T${newAppointment.time}`;
      const startDateTime = parseISO(dateTimeString);
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Invalid date and time");
      }
  
      // Calculate end time by adding duration to start time
      const endDateTime = addMinutes(startDateTime, newAppointment.duration);
  
      // Prepare recurrence rule if needed
      let recurrenceRule = null;
      if (newAppointment.frequency === 'weekly') {
        const weekdayMap = {
          'Mon': 'MO', 'Tue': 'TU', 'Wed': 'WE', 'Thu': 'TH', 'Fri': 'FR', 'Sat': 'SA', 'Sun': 'SU'
        };
        const formattedWeekdays = newAppointment.weekdays.map(day => weekdayMap[day]).join(',');
  
        recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${formattedWeekdays}`;
        if (newAppointment.endsOn) {
          const endDate = parseISO(newAppointment.endsOn);
          recurrenceRule += `;UNTIL=${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`;
        } else if (newAppointment.sessions) {
          recurrenceRule += `;COUNT=${newAppointment.sessions}`;
        }
      }
  
      const bookingData = {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        patient: patient.id,
        employee: newAppointment.employee,
        sellable: newAppointment.sellable,
        recurrence: recurrenceRule,
      };
  
      console.log("Booking Data:", bookingData);
  
      const response = await createBooking(bookingData);
  
      // Update appointments state
      setAppointments(prevAppointments => [...prevAppointments, response]);
  
      // Reset newAppointment to default values
      setNewAppointment({
        date: '',
        time: '09:00',
        employee: '',
        sellable: '',
        duration: 30,
        frequency: 'does_not_repeat',
        weekdays: [],
        endsOn: '',
        sessions: '',
      });
  
      setIsAppointmentDialogOpen(false);
      toast({ title: "Success", description: "Appointment booked successfully" });
  
      // Re-fetch appointments to update the list
      fetchAppointments();
    } catch (error) {
      console.error("Error in handleAddAppointment:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };  

  const handleAddVisit = async (e) => {
    e.preventDefault();
    try {
      console.log('Original newVisit date:', newVisit.date);
  
      // Ensure we're working with a Date object
      const selectedDate = new Date(newVisit.date);
      
      // Convert the date to UTC
      const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      ));
      
      // Format the UTC date to YYYY-MM-DD
      let formattedDate
      const currentMonth = new Date().getMonth()
      const selectedMonth = selectedDate.getMonth()
      let currentDay = new Date().getDay()
      const selectedDay = selectedDate.getDay()
      if(currentMonth === selectedMonth && currentDay === selectedDay){
        formattedDate = utcDate.toISOString().split('T')[0];
      } else {
        formattedDate = addDays(utcDate, 1).toISOString().split('T')[0];
      }
      
      const visitData = {
        date: formattedDate,
        time: newVisit.time,
        comment: newVisit.comment,
        employee: newVisit.employee,
        sellable: newVisit.sellable,
        sellable_reduce_balance: newVisit.sellable_reduce_balance,
        walk_in: newVisit.walk_in,
        penalty: newVisit.penalty,
        duration: newVisit.duration.toString()
      };
  
      console.log("Final visit data to be sent:", visitData);
  
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/visit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visitData),
      });
  
      // Format the response to match the expected structure
      const formattedResponse = {
        ...response,
        employee: response.employee,
        sellable: response.sellable
      };
  
      setVisits(prevVisits => [...prevVisits, formattedResponse]);
      
      // Fetch details for the new visit
      if (response.employee) fetchEmployeeDetails(response.employee);
      if (response.sellable) fetchSellableDetails(response.sellable);
  
      setNewVisit({
        date: new Date(),
        time: '',
        comment: '',
        employee: '',
        sellable: '',
        sellable_reduce_balance: false,
        walk_in: false,
        penalty: false,
        duration: 30
      });
      setIsVisitDialogOpen(false);
      toast({ title: "Success", description: "Visit added successfully" });
  
      // Refresh the visits data
      fetchVisits();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/${employeeId}/`);
      setEmployeeDetails(prevDetails => ({
        ...prevDetails,
        [employeeId]: data
      }));
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      setEmployeeDetails(prevDetails => ({
        ...prevDetails,
        [employeeId]: {
          id: employeeId,
          first_name: "Inactive",
          last_name: "Therapist",
          email: "N/A",
          mobile: "N/A",
          role: "Inactive Therapist", // setting role or status to indicate inactivity
          user: null
        }
      }));
    }
  };
  
  const fetchSellableDetails = async (sellableId) => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/sellable/${sellableId}/`);
      setSellableDetails(prevDetails => ({
        ...prevDetails,
        [sellableId]: data
      }));
    } catch (error) {
      console.error("Failed to fetch sellable details:", error);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setpaymentadd(true);
    try {
      console.log('Original newPayment date:', newPayment.date);
  
      // Ensure we're working with a Date object for the payment date
      const selectedDate = new Date(newPayment.date);
  
      // Convert the date to UTC (to avoid timezone issues)
      const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      ));
  
      // Format the UTC date to YYYY-MM-DD
      let formattedDate
      const currentMonth = new Date().getMonth()
      const selectedMonth = selectedDate.getMonth()
      let currentDay = new Date().getDay()
      const selectedDay = selectedDate.getDay()
      if(currentMonth === selectedMonth && currentDay === selectedDay){
        formattedDate = utcDate.toISOString().split('T')[0];
      } else {
        formattedDate = addDays(utcDate, 1).toISOString().split('T')[0];
      }
  
      // Prepare the payment data with the corrected date format
      const paymentData = {
        amount_paid: newPayment.amount_paid,
        amount_refunded: newPayment.amount_refunded || '0',
        date: formattedDate, // Corrected UTC date
        channel: newPayment.channel
      };
  
      console.log("Final payment data to be sent:", paymentData);
  
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
  
      // Format the response as needed
      const formattedResponse = {
        ...response
      };
  
      // Update payments state with the new payment
      setPayments(prevPayments => [...prevPayments, formattedResponse]);
  
      // Reset the payment form with the corrected date
      let localDate = new Date();
      localDate.setHours(0, 0, 0, 0); // Set to midnight
      localDate.setDate(localDate.getDate() + 1); // Add one day
  
      setNewPayment({
        amount_paid: '',
        amount_refunded: '0',
        date: localDate.toISOString().split('T')[0], // Set default date to tomorrow
        channel: ''
      });
  
      setIsPaymentDialogOpen(false);
      toast({ title: "Success", description: "Payment added successfully" });
  
      // Fetch the updated payments data
      fetchLedgerTransactions();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    finally{
        setpaymentadd(false); 
    }
  };
  

  const fetchInvoices = async () => {
    try {
      const data = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/invoice/`);
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    }
  };

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceDetailDialogOpen, setIsInvoiceDetailDialogOpen] = useState(false);

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/invoice/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          status: 'd',
          gross_amount: finalAmount.toString(),
          final_amount: finalAmount.toString(),
          items: invoiceItems
        }),
      });
      
      setSelectedInvoice(response);
      setIsInvoiceDialogOpen(false);
      setIsInvoiceStatusDialogOpen(true);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const updateInvoiceStatus = async (status) => {
    setIsConfirmingInvoice(true);
    try {
      await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/invoice/${selectedInvoice.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      toast({ title: "Success", description: `Invoice ${status === 'c' ? 'confirmed' : 'cancelled'} successfully` });
      await fetchInvoices();
      await fetchLedgerTransactions();
      setIsInvoiceStatusDialogOpen(false);
      setIsInvoiceDetailDialogOpen(false);
      setInvoiceItems([]);
      setFinalAmount(0);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsConfirmingInvoice(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const response = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/invoice/${invoiceId}/`);
      setSelectedInvoice(response);
      setIsInvoiceDetailDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoice details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoiceHtml = (htmlUrl) => {
    window.open(htmlUrl, '_blank');
  };

  const handleDownloadInvoicePdf = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
  };

// Generic export to Excel function
const exportToExcel = async (data, filename, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Add headers
  worksheet.columns = columns.map(col => ({ header: col.header, key: col.key, width: 15 }));

  // Add data
  data.forEach(row => {
    const rowData = {};
    columns.forEach(col => {
      if (col.format) {
        rowData[col.key] = col.format(row[col.key]);
      } else {
        rowData[col.key] = row[col.key];
      }
    });
    worksheet.addRow(rowData);
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
};

// Export visits to Excel
const exportVisitsToExcel = async () => {
  const columns = [
    { header: 'Date', key: 'date', format: (value) => format(parseISO(value), 'dd/MM/yyyy') },
    { header: 'Time', key: 'time' },
    { header: 'Doctor', key: 'doctor' },
    { header: 'Service', key: 'service' },
    { header: 'Duration', key: 'duration', format: (value) => `${value} minutes` },
    { header: 'Walk-in', key: 'walk_in', format: (value) => value ? 'Yes' : 'No' },
    { header: 'Penalty', key: 'penalty', format: (value) => value ? 'Yes' : 'No' },
  ];

  const processedData = visits.map(visit => ({
    ...visit,
    doctor: employeeDetails[visit.employee] 
      ? `${employeeDetails[visit.employee].first_name} ${employeeDetails[visit.employee].last_name}`
      : 'Unknown',
    service: sellableDetails[visit.sellable]
      ? sellableDetails[visit.sellable].name
      : 'Unknown',
  }));

  await exportToExcel(processedData, 'patient_visits', columns);
};

// Export appointments to Excel
const exportAppointmentsToExcel = async () => {
  const columns = [
    { header: 'Therapist', key: 'therapist' },
    { header: 'Date', key: 'date', format: (value) => format(parseISO(value), 'dd/MM/yyyy') },
    { header: 'Start Time', key: 'startTime', format: (value) => format(parseISO(value), 'HH:mm') },
    { header: 'End Time', key: 'endTime', format: (value) => format(parseISO(value), 'HH:mm') },
    { header: 'Service', key: 'service' },
  ];

  const processedData = appointments.map(appointment => ({
    therapist: `${appointment.employee.first_name} ${appointment.employee.last_name}`,
    date: appointment.start,
    startTime: appointment.start,
    endTime: appointment.end,
    service: sellableDetails[appointment.sellable]
      ? sellableDetails[appointment.sellable].name
      : 'Unknown',
  }));

  await exportToExcel(processedData, 'patient_appointments', columns);
};

// Export ledger transactions to Excel
const exportLedgerTransactionsToExcel = async () => {
  const columns = [
    { header: 'Date', key: 'date', format: (value) => format(parseISO(value), 'dd/MM/yyyy') },
    { header: 'Transaction', key: 'transactionType' },
    { header: 'Amount Paid', key: 'amount_credit', format: (value) => value.toFixed(2) },
    { header: 'Invoiced Amount', key: 'amount_debit', format: (value) => value.toFixed(2) },
    { header: 'Balance', key: 'balance', format: (value) => value.toFixed(2) },
  ];

  await exportToExcel(ledgerTransactions, 'patient_ledger_transactions', columns);
};

  useEffect(() => {
    fetchPatientData();
    fetchNotes();
    fetchGoals();
    fetchTasks();
    fetchAppointments();
    fetchTherapists();
    fetchSellables();
    fetchPayments();
    fetchPaymentChannels();
    fetchVisits();
    fetchInvoices();
  }, [clinic_id, patient_id]);



  useEffect(() => {
    fetchPatientData();
    fetchNotes();
    fetchGoals();
    fetchTasks();
    fetchBookings();
    fetchTherapists();
    fetchSellables();
  }, [clinic_id, patient_id]);

  // const handleChange = (e) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const updatedPatient = await fetchWithTokenHandling(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}/`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(formData),
  //     });
  //     setPatient(updatedPatient);
  //     setIsEditing(false);
  //     toast({ title: "Success", description: "Patient information updated successfully" });
  //   } catch (error) {
  //     toast({ title: "Error", description: error.message, variant: "destructive" });
  //   }
  // };

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isInvoiceStatusDialogOpen, setIsInvoiceStatusDialogOpen] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedSellable, setSelectedSellable] = useState('');
  const [finalAmount, setFinalAmount] = useState(0);

  const handleAddInvoiceItem = () => {
    const sellable = sellables.find(s => s.id === selectedSellable);
    if (sellable) {
      const newItem = {
        sellable: sellable.id,
        name: sellable.name,
        quantity: 1,
        rate: parseFloat(sellable.rate),
        gross: parseFloat(sellable.rate),
        discount: 0,
        net: parseFloat(sellable.rate),
        tax: 0,
        add_balance: true
      };
      setInvoiceItems([...invoiceItems, newItem]);
      calculateFinalAmount([...invoiceItems, newItem]);
    }
  };
  const handleedit = () => {
    navigate(`/clinic/${clinic_id}/patients/${patient_id}/update`, {
    state: { PatientData: patient,
      therapists:therapists,
      therapist_primary: patient.therapist_primary,
    },
    });
  };
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
  
    const item = updatedItems[index];
  
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
  
    item.gross = quantity * rate;
    item.net = item.gross - discount;
  
    setInvoiceItems(updatedItems);
    calculateFinalAmount(updatedItems);
  };
  

  const handleRemoveInvoiceItem = (index) => {
    const updatedItems = [...invoiceItems];
    updatedItems.splice(index, 1);
    setInvoiceItems(updatedItems);
    calculateFinalAmount(updatedItems);
  };  
  
  const calculateFinalAmount = (items) => {
    const total = items.reduce((sum, item) => sum + item.net, 0);
    setFinalAmount(total);
  };  

  const handleAddNewInvoice = () => {
    setInvoiceItems([]);
    setFinalAmount(0);
    setIsInvoiceDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <Progress value={progress} className="w-[60%]" />
        <p className="mt-4 text-sm text-gray-500">Loading employees... {Math.round(progress)}%</p>
      </div>
    );
  }
  if (!patient) return <div>Patient not found</div>;

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
      <Select value={value} onValueChange={(newTime) => onChange(newTime)}>
        <SelectTrigger>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {generateTimeOptions()}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="flex w-full h-full gap-8 shadow-xl">
     <Card className="w-[40%] mx-auto shadow-lg">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
    <CardTitle className="text-center flex-1 text-lg font-semibold">
      Patient Information
    </CardTitle>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setIsInvoiceDialogOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Generate Invoice</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsVisitDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Mark New Visit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Patient Details</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.location.href = `tel:${patient.mobile}`}>
          <Phone className="mr-2 h-4 w-4" />
          <span>Call {patient.mobile}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = `mailto:${patient.email}`}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Email {patient.email}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </CardHeader>

  <CardContent>
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col items-center space-y-6">
        <Avatar className="w-24 h-24 shadow-md rounded-full">
          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${formData.first_name}${formData.last_name}`} />
          <AvatarFallback>{formData.first_name.charAt(0)}{formData.last_name ? formData.last_name.charAt(0) : ""}</AvatarFallback>
        </Avatar>

        <CardTitle className="text-center text-lg font-medium text-gray-700">
          {formData.patient_id}
        </CardTitle>

        <div className="w-full space-y-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={!isEditing}
              className="border-gray-300 focus:ring-primary"
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={!isEditing}
              className="border-gray-300 focus:ring-primary"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="border-gray-300 focus:ring-primary"
            />
          </div>

          {/* Country Code and Mobile Number aligned on the same vertical level */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="country_code">Country Code</Label>
              <Select
                id="country_code"
                name="country_code"
                value={formData.country_code}
                onValueChange={(value) => setFormData({ ...formData, country_code: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country code" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((code, index) => (
                    <SelectItem key={`${code.code}-${index}`} value={code.code}>
                      {code.name} ({code.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                disabled={!isEditing}
                className="border-gray-300 focus:ring-primary"
              />

            </div>
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              disabled={!isEditing}
              className="border-gray-300 focus:ring-primary"
            />
          </div>
        </div>

        <div className="w-full flex justify-between items-center">
            <Button type="button" onClick={handleedit}>Edit Patient</Button>
          <Link to={`/clinic/${clinic_id}/patients/${patient_id}/schedule`}>
            <Button variant="outline">View Schedule</Button>
          </Link>
        </div>
      </div>
    </form>
  </CardContent>
</Card>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="gap-4">
              <Label htmlFor="sellable" className="text-right">
                Product/Service
              </Label>
              <Select 
                onValueChange={setSelectedSellable} 
                value={selectedSellable}
                className="col-span-3"
              >
                <SelectTrigger id="sellable">
                  <SelectValue placeholder="Select product/service" />
                </SelectTrigger>
                <SelectContent>
                  {sellables.map(sellable => (
                    <SelectItem key={sellable.id} value={sellable.id}>
                      {sellable.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddInvoiceItem}>+ Add Item</Button>
            <div className="border p-2">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Product/Service</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Gross</th>
                    <th>Discount</th>
                    <th>Net</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">No items added</td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            className="w-16"
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            step="any"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td>{item.gross}</td>
                        <td>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </td>
                        <td>{item.net}</td>
                        <td>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveInvoiceItem(index)}>
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="finalAmount" className="text-right">
                Final Amount
              </Label>
              <Input 
                id="finalAmount" 
                value={finalAmount} 
                readOnly
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGenerateInvoice}>Generate Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full space-y-8">
        <Tabs className='w-full h-full' defaultValue="notes">
          <TabsList className='w-full justify-around'>
            <TabsTrigger className='px-12' value="notes">Notes</TabsTrigger>
            <TabsTrigger className='px-12' value="goals">Goals</TabsTrigger>
            <TabsTrigger className='px-12' value="appointments">Appointments</TabsTrigger>
            <TabsTrigger className='px-12' value="visits">Visits</TabsTrigger>
            <TabsTrigger className='px-12' value="transactions">Transactions</TabsTrigger>
            <TabsTrigger className='px-12' value="tasks">Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="relative min-h-[300px] h-[90%] p-4 ">
            {notes.length === 0 ? (
              <p>No notes available for this patient.</p>
            ) : (
              notes.map(note => (
                <Dialog 
                  key={note.id} 
                  open={openNoteDialogs[note.id]} 
                  onOpenChange={(open) => setOpenNoteDialogs(prev => ({ ...prev, [note.id]: open }))}
                >
                  <DialogTrigger asChild>
                    <div 
                      className="p-2 bg-gray-100 rounded mb-2 cursor-pointer" 
                      onClick={() => {
                        fetchNoteDetails(note.id);
                        setOpenNoteDialogs(prev => ({ ...prev, [note.id]: true }));
                      }}
                    >
                      <p>{note.description}</p>
                      <small>{new Date(note.created_on).toLocaleString()}</small>
                      {note.files && note.files.map(file => (
                        <div key={file.id} className="flex items-center mt-2">
                          <FileIcon className="h-4 w-4 mr-2" />
                          <a href={file.file} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{file.name}</a>
                        </div>
                      ))}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Note Details</DialogTitle>
                    </DialogHeader>
                    {selectedNote && (
                      <>
                        <Textarea 
                          value={selectedNote.description}
                          onChange={(e) => setSelectedNote({...selectedNote, description: e.target.value})}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="visible-to-patient"
                            checked={selectedNote.visible_to_patient}
                            onCheckedChange={(checked) => setSelectedNote({...selectedNote, visible_to_patient: checked})}
                          />
                          <Label htmlFor="visible-to-patient">Visible to patient</Label>
                        </div>
                        {fileDetails !== null ? (
                          <div>
                            <h3>Attached Images:</h3>
                            {renderNotes()}
                          </div>
                        ) : <></>}
                        <Input 
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange} 
                        />
                        <Button onClick={() => {
                          updateNote(selectedNote.id, {
                            description: selectedNote.description,
                            visible_to_patient: selectedNote.visible_to_patient
                          });
                          if (selectedFile) {
                            uploadFile(selectedNote.id);
                          }
                        }}>Update Note</Button>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              ))
            )}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="absolute bottom-0 right-0">
                <PlusCircle className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                </DialogHeader>
                <Textarea 
                  value={newNote.description}
                  onChange={(e) => setNewNote({...newNote, description: e.target.value})}
                  placeholder="Enter note..."
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visible-to-patient"
                    checked={newNote.visible_to_patient}
                    onCheckedChange={(checked) => setNewNote({...newNote, visible_to_patient: checked})}
                  />
                  <Label htmlFor="visible-to-patient">Visible to patient</Label>
                </div>
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange} 
                />
                <Button onClick={addNote}>Save Note</Button>
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="goals" className="relative min-h-[300px] h-[90%] overflow-scroll p-4 ">
          {goals.length === 0 ? (
                <p>No goals set for this patient.</p>
              ) : (
                goals.map(goal => (
                  <Dialog 
                    key={goal.id} 
                    open={openGoalDialogs[goal.id]} 
                    onOpenChange={(open) => setOpenGoalDialogs(prev => ({ ...prev, [goal.id]: open }))}
                  >
                    <DialogTrigger asChild>
                      <div 
                          className="p-2 bg-gray-100 rounded mb-2 cursor-pointer" 
                          onClick={() => {
                            fetchGoalDetails(goal.id);
                            setOpenGoalDialogs(prev => ({ ...prev, [goal.id]: true }));
                          }}
                        >
                        <h3>{goal.title}</h3>
                        <p>{goal.description}</p>
                        <small>Complete by: {goal.complete_by}</small>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Goal Details</DialogTitle>
                      </DialogHeader>
                      {selectedGoal && (
                        <>
                          <Input 
                            value={selectedGoal.title}
                            onChange={(e) => setSelectedGoal({...selectedGoal, title: e.target.value})}
                            placeholder="Goal title"
                          />
                          <Textarea 
                            value={selectedGoal.description}
                            onChange={(e) => setSelectedGoal({...selectedGoal, description: e.target.value})}
                            placeholder="Goal description"
                          />
                          <DatePicker
                            selected={selectedGoal.complete_by ? new Date(selectedGoal.complete_by) : null}
                            onChange={(date) => setSelectedGoal({...selectedGoal, complete_by: date.toISOString().split('T')[0]})}
                            placeholderText="Complete by"
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is-completed"
                              checked={selectedGoal.is_completed}
                              onCheckedChange={(checked) => setSelectedGoal({...selectedGoal, is_completed: checked})}
                            />
                            <Label htmlFor="is-completed">Is completed</Label>
                          </div>
                          <Button onClick={() => updateGoal(selectedGoal.id, {
                            title: selectedGoal.title,
                            description: selectedGoal.description,
                            complete_by: selectedGoal.complete_by,
                            is_completed: selectedGoal.is_completed
                          })}>Update Goal</Button>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                ))
              )}
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="absolute bottom-0 right-0">
                <PlusCircle className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Goal</DialogTitle>
                </DialogHeader>
                <Input 
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Goal title"
                />
                <Textarea 
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Goal description"
                />
                <DatePicker
                  selected={newGoal.complete_by ? new Date(newGoal.complete_by) : null}
                  onChange={(date) => setNewGoal({...newGoal, complete_by: date.toISOString().split('T')[0]})}
                  placeholderText="Complete by"
                />
                <Button onClick={addGoal}>Save Goal</Button>
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="tasks" className="relative min-h-[300px] h-[90%] p-4 ">
            {tasks.length === 0 ? (
                <p>No tasks assigned to this patient.</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="p-2 bg-gray-100 rounded mb-2 flex justify-between items-center">
                    <div>
                      <h3>{task.name}</h3>
                      <p>{task.description}</p>
                      <p>Repetitions: {task.repetitions}</p>
                      <p>Completed this week: {task.completed_this_week}</p>
                    </div>
                    <Button
                      onClick={() => completeTask(task.id)}
                      disabled={task.completed_this_week >= task.repetitions}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                ))
              )}
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="absolute bottom-0 right-0"><PlusCircle className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <Input 
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  placeholder="Task name"
                />
                <Textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Task description"
                />
                <Input 
                  type="number"
                  value={newTask.repetitions}
                  onChange={(e) => setNewTask({...newTask, repetitions: parseInt(e.target.value)})}
                  placeholder="Repetitions"
                />
                <Select onValueChange={(value) => setNewTask({...newTask, goal: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addTask}>Save Task</Button>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Appointment TabsContent */}
          <TabsContent value="appointments" className="relative min-h-[300px] h-[90%] overflow-scroll p-4">
            <div className="flex justify-end mb-4 space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> {dateRangeDisplay}</Button>
                </PopoverTrigger>
                <PopoverContent className="">
                  <Select value={dateRange} onValueChange={(value) => {
                    setDateRange(value);
                    if (value !== 'custom') {
                      setCustomDateRange({ from: null, to: null });
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Appointments</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  {dateRange === 'custom' && (
                    <div className="mt-4">
                      <DateRangePicker
                        from={customDateRange.from}
                        to={customDateRange.to}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setCustomDateRange(range);
                            setDateRange('custom');
                            fetchAppointments();
                          }
                        }}
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Button onClick={() => setIsSellableCountsDialogOpen(true)} className="ml-2">
                View Sellable Counts
              </Button>
              <Button onClick={() => setIsTherapistCountsDialogOpen(true)} className="ml-2">
                View Therapist Counts
              </Button>
              <Button onClick={exportAppointmentsToExcel}>
                  <FileDownIcon className="h-4 w-4 mr-2" /> Export as Excel
              </Button>
            </div>
            {appointments.length === 0 ? (
              <p>No upcoming appointments for this patient.</p>
            ) : (
              <>
                <AppointmentsDataTable data={appointments} />
              </>
            )}
            <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className='sticky bottom-0 right-0 flex self-end ml-auto mt-4' >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Appointment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAppointment}>
                  <div className="grid gap-4 py-4">
                    <Select onValueChange={(value) => setNewAppointment({...newAppointment, employee: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Therapist" />
                      </SelectTrigger>
                      <SelectContent>
                        {therapists.map(therapist => (
                          <SelectItem key={therapist.id} value={therapist.id}>
                            {therapist.first_name} {therapist.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={(value) => setNewAppointment({...newAppointment, sellable: value})}>
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
                          <Label htmlFor="date">Starts On (DD/MM/YYYY)</Label>
                          <DatePicker
                            id="date"
                            selected={newAppointment.date ? new Date(newAppointment.date) : null}
                            onChange={(date) => setNewAppointment({...newAppointment, date: date.toISOString().split('T')[0]})}
                            dateFormat="dd/MM/yyyy"
                          />
                          {/* 
                          <DatePicker
                            id="enddate"
                            selected={date}
                            onChange={(date) => setNewVisit({...newVisit, endsOn: date ? date.toISOString().split('T')[0] : ''})}
                            dateFormat="dd/MM/yyyy"
                          /> */}
                        </div>
                        <div>
                          <Label htmlFor="time">Time</Label>
                          {/* <TimeSelect
                            id="time"
                            value={newAppointment.time}
                            onChange={(time) => setNewAppointment({...newAppointment, time: time})}
                          /> */}
                          <ClockPicker 
                            id="time"
                            value={newAppointment.time}
                            onChange={(time) => setNewAppointment({...newAppointment, time: time})}
                          />
                        </div>
                      </div>
                    </div>

                    <Select onValueChange={(value) => setNewAppointment({...newAppointment, frequency: value})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="does_not_repeat">Does not repeat</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>

                    {newAppointment.frequency === 'weekly' && (
                      <>
                        <div>
                          <Label className="mb-2 block">Select Weekdays</Label>
                          <div className="flex flex-wrap gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                              <Button
                                key={day}
                                type="button"
                                variant={newAppointment.weekdays.includes(day) ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const updatedWeekdays = newAppointment.weekdays.includes(day)
                                    ? newAppointment.weekdays.filter(d => d !== day)
                                    : [...newAppointment.weekdays, day];
                                  setNewAppointment({...newAppointment, weekdays: updatedWeekdays});
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
                            onChange={(date) => setNewAppointment({...newAppointment, endsOn: date ? date.toISOString().split('T')[0] : ''})}
                            dateFormat="dd/MM/yyyy"
                          /> 
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sessions">OR</Label>
                          <Input
                            id="sessions"
                            type="number"
                            placeholder="For next 'X' sessions"
                            value={newAppointment.sessions}
                            onChange={(e) => setNewAppointment({...newAppointment, sessions: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <RadioGroup onValueChange={(value) => setNewAppointment({...newAppointment, duration: parseInt(value)})}>
                        <div className="flex flex-wrap gap-2">
                          {[30, 45, 60, 90].map((duration) => (
                            <div key={duration} className="flex items-center space-x-2">
                              <RadioGroupItem value={duration.toString()} id={`duration-${duration}`} />
                              <Label htmlFor={`duration-${duration}`}>{duration} Mins</Label>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="duration-custom" />
                            <Label htmlFor="duration-custom">Custom</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {newAppointment.duration === 'custom' && (
                      <Input
                        type="number"
                        placeholder="Custom Duration in mins"
                        value={newAppointment.duration}
                        onChange={(e) => setNewAppointment({...newAppointment, duration: parseInt(e.target.value)})}
                      />
                    )}
                  </div>
                  <Button type="submit" className="w-full">Book Appointment</Button>
                </form>
              </DialogContent>
            </Dialog>
            
            <TherapistCountsDialog
              isOpen={isTherapistCountsDialogOpen}
              onClose={() => setIsTherapistCountsDialogOpen(false)}
              appointments={appointments}
            />
            
            <SellableCountsDialog
              isOpen={isSellableCountsDialogOpen}
              onClose={() => setIsSellableCountsDialogOpen(false)}
              appointments={appointments}
              sellableDetails={sellableDetails}
            />
          </TabsContent>
          
          <TabsContent value="transactions" className="relative min-h-[300px] h-[90%] overflow-scroll p-4">
            <Tabs defaultValue="payments">
              <TabsList>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="invoices">Drafted/Cancelled Invoices</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              <TabsContent value="payments" className="relative min-h-[300px] h-[90%] overflow-scroll p-4 ">
                {payments.length === 0 ? (
                  <p>No payments recorded for this patient.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='text-center'>Date</TableHead>
                        <TableHead className='text-center'>Amount Paid</TableHead>
                        <TableHead className='text-center'>Amount Refunded</TableHead>
                        <TableHead className='text-center'>Channel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.date), 'EEEE dd MMMM yyyy')}</TableCell>
                          <TableCell>{payment.amount_paid}</TableCell>
                          <TableCell>{payment.amount_refunded}</TableCell>
                          <TableCell>{paymentChannels.find(ch => ch.id === payment.channel)?.name || 'Unknown'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="absolute bottom-0 right-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPayment}>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount_paid">Amount Paid</Label>
                          <Input
                            id="amount_paid"
                            type="number"
                            value={newPayment.amount_paid}
                            onChange={(e) => setNewPayment({...newPayment, amount_paid: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Payment Date</Label>
                          <DatePicker
                            id="date"
                            selected={newPayment.date}
                            onChange={(date) => setNewPayment({...newPayment, date: date.toISOString().split('T')[0]})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="channel">Payment Channel</Label>
                          <Select onValueChange={(value) => setNewPayment({...newPayment, channel: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment channel required" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentChannels.map(channel => (
                                <SelectItem key={channel.id} value={channel.id}>
                                  {channel.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <br />
                      <DialogFooter>
                        <Button type="submit" disabled={paymentadd}>
                             {paymentadd? "Adding Payment..." : "Add Payment"}
                       </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </TabsContent>
              <TabsContent value="invoices" className="relative min-h-[300px] h-[90%] overflow-scroll p-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={handleAddNewInvoice} className="absolute bottom-0 right-0">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {invoices.filter(invoice => invoice.status !== 'c').length === 0 ? (
                  <p>No draft or cancelled invoices for this patient.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='text-center'>Date</TableHead>
                        <TableHead className='text-center'>Invoice Number</TableHead>
                        <TableHead className='text-center'>Status</TableHead>
                        <TableHead className='text-center'>Gross Amount</TableHead>
                        <TableHead className='text-center'>Final Amount</TableHead>
                        <TableHead className='text-center'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices
                        .filter(invoice => invoice.status !== 'c')
                        .map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell>{format(new Date(invoice.date), 'EEEE dd MMMM yyyy')}</TableCell>
                            <TableCell>{invoice.number}</TableCell>
                            <TableCell>
                              {invoice.status === 'd' ? 'Draft' : 
                              invoice.status === 'x' ? 'Cancelled' : 'Unknown'}
                            </TableCell>
                            <TableCell>{invoice.gross_amount}</TableCell>
                            <TableCell>{invoice.final_amount}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="transactions" className="relative min-h-[300px] h-[90%] overflow-scroll p-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={() => exportLedgerTransactionsToExcel(ledgerTransactions, 'patient_ledger_transactions')}>
                    <FileDownIcon className="h-4 w-4 mr-2" /> Export as Excel
                  </Button>
                </div>
                {ledgerLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : ledgerTransactions.length === 0 ? (
                  <p>No transactions recorded for this patient.</p>
                ) : (
                  <LedgerTable data={ledgerTransactions} />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>


          <TabsContent value="visits" className="relative min-h-[300px] h-[90%] overflow-scroll p-4">
            <div className="flex justify-end mb-4 space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" />{dateRangeDisplay}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <Select value={dateRange} onValueChange={(value) => {
                    setDateRange(value);
                    if (value !== 'custom') {
                      setCustomDateRange({ from: null, to: null });
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visits</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  {dateRange === 'custom' && (
                    <div className="mt-4">
                      <DateRangePicker
                        from={customDateRange.from}
                        to={customDateRange.to}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setCustomDateRange(range);
                          }
                        }}
                      />
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <Button onClick={() => setIsVisitCountsDialogOpen(true)}>
                View Therapist Visit Counts
              </Button>
              <Button onClick={exportVisitsToExcel}>
                <FileDownIcon className="h-4 w-4 mr-2" /> Export as Excel
              </Button>
            </div>
            {filteredVisits.length === 0 ? (
              <p>No visits recorded for this patient.</p>
            ) : (
              <VisitsDataTable data={filteredVisits} />
            )}
            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="absolute bottom-0 right-0">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                {console.log("Dialog rendering with date:", newVisit.date)}
                <DialogHeader>
                  <DialogTitle>Add New Visit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddVisit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Visit Date</Label>
                      <DatePicker
                        value={newVisit.date}
                        onChange={(date) => setNewVisit({...newVisit, date: date})}
                      />
                    </div>
                    <div className='flex items-center gap-6'>
                      <Label htmlFor="time">Visit Time</Label>
                      {/* <TimeSelect
                        id="time"
                        value={newVisit.time}
                        onChange={(time) => setNewVisit({...newVisit, time: time})}
                      /> */}
                      <ClockPicker 
                        id="time"
                        value={newVisit.time}
                        onChange={(time) => setNewVisit({...newVisit, time: time})}  
                      />
                    </div>
                    <div>
                      <Label htmlFor="employee">Doctor</Label>
                      <Select onValueChange={(value) => setNewVisit({...newVisit, employee: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapists.map(therapist => (
                            <SelectItem key={therapist.id} value={therapist.id}>
                              {therapist.first_name} {therapist.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sellable">Product/Service</Label>
                      <Select onValueChange={(value) => setNewVisit({...newVisit, sellable: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product/service" />
                        </SelectTrigger>
                        <SelectContent>
                          {sellables.map(sellable => (
                            <SelectItem key={sellable.id} value={sellable.id}>
                              {sellable.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newVisit.duration}
                        onChange={(e) => setNewVisit({...newVisit, duration: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="comment">Comment</Label>
                      <Textarea
                        id="comment"
                        value={newVisit.comment}
                        onChange={(e) => setNewVisit({...newVisit, comment: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sellable_reduce_balance"
                        checked={newVisit.sellable_reduce_balance}
                        onCheckedChange={(checked) => setNewVisit({...newVisit, sellable_reduce_balance: checked})}
                      />
                      <Label htmlFor="sellable_reduce_balance">Reduce sellable balance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="walk_in"
                        checked={newVisit.walk_in}
                        onCheckedChange={(checked) => setNewVisit({...newVisit, walk_in: checked})}
                      />
                      <Label htmlFor="walk_in">Walk-in</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="penalty"
                        checked={newVisit.penalty}
                        onCheckedChange={(checked) => setNewVisit({...newVisit, penalty: checked})}
                      />
                      <Label htmlFor="penalty">Penalty</Label>
                    </div>
                  </div>
                  <Button type="submit" className="mt-4">Add Visit</Button>
                </form>
              </DialogContent>
            </Dialog>
            <VisitCountsDialog
              isOpen={isVisitCountsDialogOpen}
              onClose={() => setIsVisitCountsDialogOpen(false)}
              visits={filteredVisits}
              employeeDetails={employeeDetails}
            />
          </TabsContent>
        </Tabs>
        <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
              <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Visit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddVisit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Visit Date</Label>
                      <DatePicker
                        id="date"
                        selected={newVisit.date ? new Date(newVisit.date) : null}
                        dateFormat="dd/MM/yyyy"
                        onChange={(date) => setNewVisit({...newVisit, date: date.toISOString().split('T')[0]})}
                        />
                    </div>
                    <div className='flex items-center gap-6'>
                      <Label htmlFor="time">Visit Time</Label>
                      {/* <TimeSelect
                        id="time"
                        value={newVisit.time}
                        onChange={(time) => setNewVisit({...newVisit, time: time})}
                      /> */}
                      <ClockPicker 
                        id="time"
                        value={newVisit.time}
                        onChange={(time) => setNewVisit({...newVisit, time: time})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employee">Doctor</Label>
                      <Select onValueChange={(value) => setNewVisit({...newVisit, employee: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapists.map(therapist => (
                            <SelectItem key={therapist.id} value={therapist.id}>
                              {therapist.first_name} {therapist.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sellable">Product/Service</Label>
                      <Select onValueChange={(value) => setNewVisit({...newVisit, sellable: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product/service" />
                        </SelectTrigger>
                        <SelectContent>
                          {sellables.map(sellable => (
                            <SelectItem key={sellable.id} value={sellable.id}>
                              {sellable.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newVisit.duration}
                        onChange={(e) => setNewVisit({...newVisit, duration: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="comment">Comment</Label>
                      <Textarea
                        id="comment"
                        value={newVisit.comment}
                        onChange={(e) => setNewVisit({...newVisit, comment: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sellable_reduce_balance"
                        checked={newVisit.sellable_reduce_balance}
                        onCheckedChange={(checked) => setNewVisit({...newVisit, sellable_reduce_balance: checked})}
                      />
                      <Label htmlFor="sellable_reduce_balance">Reduce sellable balance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="walk_in"
                        checked={newVisit.walk_in}
                        onCheckedChange={(checked) => setNewVisit({...newVisit, walk_in: checked})}
                      />
                      <Label htmlFor="walk_in">Walk-in</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="penalty"
                        checked={newVisit.penalty}
                        onCheckedChange={(checked) => setNewVisit({...newVisit, penalty: checked})}
                      />
                      <Label htmlFor="penalty">Penalty</Label>
                    </div>
                  </div>
                  <Button type="submit" className="mt-4">Add Visit</Button>
                </form>
              </DialogContent>
        </Dialog>
      </div>
      {/* <InvoiceDialog
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        onGenerate={handleGenerateInvoice}
        invoiceItems={invoiceItems}
        setInvoiceItems={setInvoiceItems}
        finalAmount={finalAmount}
        setFinalAmount={setFinalAmount}
        sellables={sellables}
        isLoading={isGeneratingInvoice}
      /> */}

      <InvoiceStatusDialog 
        isOpen={isInvoiceStatusDialogOpen}
        onClose={() => setIsInvoiceStatusDialogOpen(false)}
        onUpdateStatus={updateInvoiceStatus}
        isLoading={isConfirmingInvoice}
      />

      <InvoiceDetailsDialog 
        invoice={selectedInvoice}
        isOpen={isInvoiceDetailDialogOpen}
        onClose={() => setIsInvoiceDetailDialogOpen(false)}
        onUpdateStatus={updateInvoiceStatus}
        isLoading={isConfirmingInvoice}
      />
    </div>
  );
};

export default PatientProfile;