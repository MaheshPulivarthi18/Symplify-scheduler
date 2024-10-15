// NewPatient.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { format } from 'date-fns';
import { countryCodes } from '@/lib/countryCodes';
import { useLocation } from 'react-router-dom';

const UpdatePatient = () => {
  const location = useLocation();
  const { PatientData } = location.state || {};  
  const patientSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  country_code: z.string().min(1, "Country code is required"),
  mobile: z.string().regex(/^\d{1,14}$/, "Mobile number must be between 1 and 14 digits."),
  country_code_alternate: z.string().optional(),
  mobile_alternate: z.string().regex(/^\d{1,14}$/, "Alternate mobile number must be between 1 and 14 digits.").optional().or(z.literal('')),
  sex: z.enum(["m", "f", "o"]),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      if (!date) return true; 
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()); 
    }, {
      message: "Invalid date. Please enter a valid date in YYYY-MM-DD format."
    })
    .optional()
    .or(z.literal('')),  
  guardian_name: z.string().optional(),
  therapist_primary: z.string().uuid("Invalid therapist ID").optional().or(z.literal('')).or(z.null()),
  priority: z.number().int().min(1).max(10),
  is_patient_active:z.boolean(),
});
  const navigate = useNavigate();
  const { clinic_id,patient_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const [therapists, setTherapists] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      country_code: "+91",
      mobile: "",
      country_code_alternate: "+91",
      mobile_alternate: "",
      sex: "m",
      dob: "",
      guardian_name: "",
      therapist_primary: "",
      priority: 9,
      is_patient_active:true,
    },
  });
  useEffect(() => {
  fetchTherapists();
  fetchPatient();
 }, []);
 const fetchPatient = async () => {
  try {
    form.reset({
      ...PatientData,
      country_code: PatientData.mobile?.slice(0, 3) || "+91",
      mobile: PatientData.mobile?.slice(3) || "",
      country_code_alternate: PatientData.mobile_alternate?.slice(0, 3) || "+91",
      mobile_alternate: PatientData.mobile_alternate?.slice(3) || "",
      therapist_primary: PatientData.therapist_primary || "",
      dob: PatientData.dob || "",
      is_patient_active: PatientData.is_patient_active !== undefined ? PatientData.is_patient_active : false,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch patient details. Please try again.",
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
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    const submitData = {
      ...values,
      mobile: values.mobile ?`${values.country_code}${values.mobile}` : null,
      mobile_alternate: values.mobile_alternate ? `${values.country_code_alternate}${values.mobile_alternate}` : null,
      dob: values.dob || null,
      has_app_access: true,
      email_alternate: null,
      therapist_primary: values.therapist_primary ? values.therapist_primary : null,
      priority: 9,
    };
    try {
      const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/${patient_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      console.log(response);
      if (!response.ok) {
        let err
        const errData = await response.json()
        if(errData.mobile){
          err = errData.mobile[0]
        }
        if(errData.email){
          err=errData.email[0]
        }
        throw new Error(err || "Failed to update patient");
      }
      toast({
        title: "Success",
        description: `updation of  patient Done scuccesfully.`,
      });
      navigate(`/clinic/${clinic_id}/patients/${patient_id}`);
    } catch (error) {
      toast({
        description: error.message || "Failed to Update patient. Please try again.",
        variant: "destructive",
      });
    }
    finally {
        setIsSubmitting(false); 
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Update Patient</h2>
        <Form {...form}>
   
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="is_patient_active"
              render={({ field }) => (
            <FormItem>
            <FormLabel></FormLabel>
            <Switch
             checked={field.value}
             onCheckedChange={field.onChange}
           />
          <span className="ml-2">{field.value ? "Active" : "Inactive"}</span>
          </FormItem>
          )}
          />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6">
                <h3 className="font-semibold">Personal details</h3>
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardian_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
  control={form.control}
  name="dob"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Date of birth (Optional)</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="date"
          onBlur={(e) => {
            if (e.target.value) {
              field.onChange(e.target.value); 
            }
          }}
        />
      </FormControl>
    </FormItem>
  )}
/>
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="m">Male</SelectItem>
                          <SelectItem value="f">Female</SelectItem>
                          <SelectItem value="o">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <h3 className="font-semibold">Contact details</h3>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryCodes.map((code) => (
                              <SelectItem key={code.code} value={code.code}>
                                {code.name} ({code.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem className="w-2/3">
                        <FormLabel>Mobile number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="country_code_alternate"
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Alt. Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryCodes.map((code) => (
                              <SelectItem key={code.code} value={code.code}>
                                {code.name} ({code.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile_alternate"
                    render={({ field }) => (
                      <FormItem className="w-2/3">
                        <FormLabel>Alternate mobile number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="font-semibold">Doctor details</h3>
                <FormField
                  control={form.control}
                  name="therapist_primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {therapists.map((therapist) => (
                            <SelectItem key={therapist.id} value={therapist.id}>
                              Dr. {therapist.first_name} {therapist.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Low</SelectItem>
                          <SelectItem value="5">Normal</SelectItem>
                          <SelectItem value="9">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting ? "Updating Ptaient..." : "Update Patient"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdatePatient;