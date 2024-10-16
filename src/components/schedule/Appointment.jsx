// AppointmentPopup.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, addMonths } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from '../ui/datepicker';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, useParams } from 'react-router-dom';
import ClockPicker from '../ui/clock';

const AppointmentPopup = ({
  event,
  onClose,
  onReschedule,
  onCancel,
  onDelete,
  onMarkVisit,
  onRevoke,
  sellables,
  onCopyRecurringAppointments,
  workingHours,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarkVisitDialogOpen, setIsMarkVisitDialogOpen] = useState(false);
  const [visitDetails, setVisitDetails] = useState({
    visitedTime: format(event.start, 'HH:mm'),
    sellable: event.service || '',
    walkIn: false,
    markPenalty: false,
    removeSessionBalance: false,
  });
  const { clinic_id } = useParams();
  const navigate = useNavigate();
  const [deleteScope, setDeleteScope] = useState('0');
  const [cancelScope, setCancelScope] = useState('T');
  const [tillDate, setTillDate] = useState(null);
  const { toast } = useToast();

  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyDetails, setCopyDetails] = useState({
    startDate: new Date(event.start),
    endDate: addMonths(new Date(event.start), 2),
    // Default values from the original appointment
    startTime: format(new Date(event.start), 'HH:mm'),
    duration: (new Date(event.end) - new Date(event.start)) / 60000,
    customDuration: '',
    weekdays: [], // Assuming you have a way to get this from the event
    sessions: '',
    frequency: event.recurrence ? 'weekly' : 'does_not_repeat',
    sellable: event.service || '',
  });
  const [editDetails, setEditDetails] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [reason, setReason] = useState('')

  useEffect(() => {
    setIsSheetOpen(true);
    setVisitDetails({
      ...visitDetails,
      visitedTime: format(event.start, 'HH:mm'),
      sellable: event.service,
    });
  }, [event]);

  const handleClose = () => {
    setIsSheetOpen(false);
    onClose();
  };

  const handleCancelClick = () => {
    onCancel(event, cancelScope, tillDate);
    setIsCancelDialogOpen(false);
    handleClose();
  };

  const handleReschedule = () => {
    onReschedule(event);
    setIsRescheduleDialogOpen(false);
    handleClose();
  };

  const handleDelete = () => {
    onDelete(event, deleteScope);
    setIsDeleteDialogOpen(false);
    handleClose();
  };

  const handleMarkVisit = () => {
    onMarkVisit(event);
    handleClose();
  };

  const handleMarkVisitClick = () => {
    setIsMarkVisitDialogOpen(true);
  };

  const handleSessionCompleted = () => {
    onMarkVisit(event.id, visitDetails);
    setIsMarkVisitDialogOpen(false);
    handleClose();
  };

  const isEventCancelled = event.status_patient === 'X' || event.status_employee === 'X';
  const isEventAttended = event.attended;

  const handleCopyAppointments = () => {
    const {
      startDate,
      startTime,
      duration,
      customDuration,
      weekdays,
      sessions,
      frequency,
      endDate,
      sellable,
    } = copyDetails;


    // Parse the start time
    const [hours, minutes] = startTime.split(':').map(Number);

    // Create a new Date object for the start time, using the date from startDate
    const start = new Date(startDate);
    start.setHours(hours, minutes, 0, 0);

    // Calculate the duration in minutes
    const durationInMinutes = duration || parseInt(customDuration);

    // Calculate end time
    const end = new Date(start.getTime() + durationInMinutes * 60000);

    // Format dates as ISO strings, but remove the 'Z' to keep them as local time
    const formatLocalDate = (date) => date.toISOString().slice(0, -1);

    const weekdayMap = {
      Mon: 'MO',
      Tue: 'TU',
      Wed: 'WE',
      Thu: 'TH',
      Fri: 'FR',
      Sat: 'SA',
      Sun: 'SU',
    };
    const formattedWeekdays = weekdays.map((day) => weekdayMap[day]).join(',');

    let rrule = event.recurrence.rrule.split("\n")[1];
    let recurrenceRule = rrule.split(";UNTIL")[0]
    console.log(recurrenceRule)
    if (frequency === 'weekly') {
      if(editDetails){
        recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${formattedWeekdays}`;
      }
      if (endDate) {
        recurrenceRule += `;UNTIL=${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`;
      } else if (sessions) {
        recurrenceRule += `;COUNT=${sessions}`;
      }
    }

    const newAppointment = {
      start: formatLocalDate(start),
      end: formatLocalDate(end),
      patient: event.patientId,
      employee: event.doctorId,
      sellable: sellable,
      recurrence: recurrenceRule,
      actor: 'E',
    };

    onCopyRecurringAppointments(newAppointment);
    setIsCopyDialogOpen(false);
    handleClose();
  };

  const handleRevoke = () => {
    onRevoke(event.id, reason)
    setIsRevokeOpen(false)
    handleClose();
  }
  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className={`w-[25%] left-[37%] items-center ${
            isEventCancelled ? 'bottom-[50%]' : 'bottom-[30%]'
          }`}
        >
          <SheetHeader>
            <SheetTitle>
              {event.title} - {event.doctorName}
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {!isEventCancelled && !isEventAttended && (
              <>
                <Button className="w-full mb-2" onClick={handleMarkVisitClick}>
                  Mark Patient Visit
                </Button>
                {event.recurrence && (
                  <Button className="w-full mb-2" onClick={() => setIsCopyDialogOpen(true)}>
                    Copy Recurring Appointments
                  </Button>
                )}
                <Button
                  className="w-full mb-2"
                  variant="outline"
                  onClick={() => setIsCancelDialogOpen(true)}
                >
                  Cancel Appointment
                </Button>
                <Button
                  className="w-full mb-2"
                  variant="outline"
                  onClick={() => setIsRescheduleDialogOpen(true)}
                >
                  Reschedule Appointment
                </Button>
                <Button
                  className="w-full mb-2"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete Appointment
                </Button>
              </>
            )}
            {isEventAttended && (
              <>
                <div className="text-green-600 font-bold mb-2">Visit Completed</div>
                <Button className="w-full" onClick={() => setIsRevokeOpen(true)}>
                  Revoke Visit
                </Button>
              </>
            )}
            <Button
              className="w-full mb-2"
              variant="outline"
              onClick={() => navigate(`/clinic/${clinic_id}/patients/${event.patientId}`)}
            >
              View Patient Details
            </Button>
            <Button className="w-full mb-2" variant="outline">
              Record New Payment
            </Button>
            <Button className="w-full" variant="outline">
              Call ({event.phoneNumber || '+919182664777'})
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Appointment Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={cancelScope} onValueChange={setCancelScope}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="T" id="cancelSingle" />
                <label htmlFor="cancelSingle">Cancel this appointment</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="F" id="cancelFuture" />
                <label htmlFor="cancelFuture">Cancel this and future appointments</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id="cancelAll" />
                <label htmlFor="cancelAll">Cancel all appointments</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="D" id="cancelTillDate" />
                <label htmlFor="cancelTillDate">Cancel till date</label>
              </div>
            </RadioGroup>

            {cancelScope === 'D' && (
              <div className="mt-4">
                <label htmlFor="tillDate">Cancel till:</label>
                <DatePicker
                  id="tillDate"
                  selected={tillDate}
                  onChange={setTillDate}
                  minDate={new Date()}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                Back
              </Button>
              <Button onClick={handleCancelClick}>Cancel Appointment(s)</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Appointment Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Do you want to Reschedule this Appointment?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
                Back
              </Button>
              <Button onClick={handleReschedule}>Reschedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
          </DialogHeader>
          <RadioGroup value={deleteScope} onValueChange={setDeleteScope}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="delete-single" />
              <Label htmlFor="delete-single">Delete this appointment only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="delete-recurrence" />
              <Label htmlFor="delete-recurrence">Delete all recurring appointments</Label>
            </div>
          </RadioGroup>
          <Button onClick={handleDelete}>Confirm Delete</Button>
        </DialogContent>
      </Dialog>

      {/* Mark Visit Dialog */}
      <Dialog open={isMarkVisitDialogOpen} onOpenChange={setIsMarkVisitDialogOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Visit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Label>Visit Date (DD/MM/YYYY)</Label>
              <DatePicker
                id="date"
                selected={visitDetails.visitedDate}
                onChange={(date) =>
                  setVisitDetails({ ...visitDetails, visitedDate: date.toISOString().split('T')[0] })
                }
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div className="mb-4 flex items-center gap-6">
              <Label>Visited Time</Label>
              <ClockPicker
                id="time"
                value={visitDetails.visitedTime}
                onChange={(time) => setVisitDetails({ ...visitDetails, visitedTime: time })}
              />
            </div>
            <div className="mb-4">
              <Label>Product / Service</Label>
              <Select
                value={visitDetails.sellable}
                onValueChange={(value) => setVisitDetails({ ...visitDetails, sellable: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product / Service" />
                </SelectTrigger>
                <SelectContent>
                  {sellables.map((sellable) => (
                    <SelectItem key={sellable.id} value={sellable.id}>
                      {sellable.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="walkIn"
                checked={visitDetails.walkIn}
                onCheckedChange={(checked) => setVisitDetails({ ...visitDetails, walkIn: checked })}
              />
              <Label htmlFor="walkIn">Walk In</Label>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="markPenalty"
                checked={visitDetails.markPenalty}
                onCheckedChange={(checked) =>
                  setVisitDetails({ ...visitDetails, markPenalty: checked })
                }
              />
              <Label htmlFor="markPenalty">Mark Penalty</Label>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="removeSessionBalance"
                checked={visitDetails.removeSessionBalance}
                onCheckedChange={(checked) =>
                  setVisitDetails({ ...visitDetails, removeSessionBalance: checked })
                }
              />
              <Label htmlFor="removeSessionBalance">Remove Session Balance</Label>
            </div>
            <Button onClick={handleSessionCompleted} className="w-full">
              Session Completed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revoke Visit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Input
                type="text"
                placeholder='Reason for revoke'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <Button onClick={handleRevoke} className="w-full">
              Revoke Visit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Copy Recurring Appointments Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Copy Recurring Appointments</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Start Date */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="copyStartDate">Start Date</Label>
              <DatePicker
                id="copyStartDate"
                selected={copyDetails.startDate}
                onChange={(date) => setCopyDetails({ ...copyDetails, startDate: date })}
                dateFormat="dd/MM/yyyy"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="copyEndDate">End Date</Label>
              <DatePicker
                id="copyEndDate"
                selected={copyDetails.endDate}
                onChange={(date) => setCopyDetails({ ...copyDetails, endDate: date })}
                dateFormat="dd/MM/yyyy"
              />
            </div>

            {/* Edit Details Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editDetails"
                checked={editDetails}
                onCheckedChange={(checked) => setEditDetails(checked)}
              />
              <Label htmlFor="editDetails">Edit Details</Label>
            </div>

            {/* Additional Fields */}
            {editDetails && (
              <>
                {/* Start Time */}
                <div>
                  <Label htmlFor="copyStartTime">Start Time</Label>
                  <ClockPicker
                    id="copyStartTime"
                    value={copyDetails.startTime}
                    onChange={(time) => setCopyDetails({ ...copyDetails, startTime: time })}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <RadioGroup
                    value={copyDetails.duration.toString()}
                    onValueChange={(value) =>
                      setCopyDetails({ ...copyDetails, duration: parseInt(value), customDuration: '' })
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      {[30, 45, 60, 90].map((duration) => (
                        <div key={duration} className="flex items-center space-x-2">
                          <RadioGroupItem value={duration.toString()} id={`copyDuration-${duration}`} />
                          <Label htmlFor={`copyDuration-${duration}`}>{duration} Mins</Label>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="copyDuration-custom" />
                        <Label htmlFor="copyDuration-custom">Custom</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {copyDetails.duration === 0 && (
                  <Input
                    type="number"
                    placeholder="Custom Duration in mins"
                    value={copyDetails.customDuration}
                    onChange={(e) => setCopyDetails({ ...copyDetails, customDuration: e.target.value })}
                  />
                )}

                {/* Frequency */}
                <Select
                  value={copyDetails.frequency}
                  onValueChange={(value) => setCopyDetails({ ...copyDetails, frequency: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="does_not_repeat">Does not repeat</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>

                {/* Weekdays */}
                {copyDetails.frequency === 'weekly' && (
                  <>
                    <div>
                      <Label className="mb-2 block">Select Weekdays</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <Button
                            key={day}
                            variant={copyDetails.weekdays.includes(day) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const updatedWeekdays = copyDetails.weekdays.includes(day)
                                ? copyDetails.weekdays.filter((d) => d !== day)
                                : [...copyDetails.weekdays, day];
                              setCopyDetails({ ...copyDetails, weekdays: updatedWeekdays });
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Sessions */}
                    <div className="space-y-2">
                      <Label htmlFor="copySessions">OR</Label>
                      <Input
                        id="copySessions"
                        type="number"
                        placeholder="For next 'X' sessions"
                        value={copyDetails.sessions}
                        onChange={(e) =>
                          setCopyDetails({ ...copyDetails, sessions: e.target.value, endDate: null })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Sellable */}
                <Select
                  value={copyDetails.sellable}
                  onValueChange={(value) => setCopyDetails({ ...copyDetails, sellable: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Product / Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellables.map((sellable) => (
                      <SelectItem key={sellable.id} value={sellable.id}>
                        {sellable.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <Button onClick={handleCopyAppointments} className="w-full">
            Copy Recurring Appointments
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentPopup;
