import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import logo from "../../assets/logo_ai 2.svg"; // Adjust the path as needed
import { Link } from 'react-router-dom'; // Assuming you're using react-router for navigation

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const ForgotPassword = () => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values) {
    console.log(values);
    // send the reset password link to email
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className='items-center gap-4'>
          <img src={logo} className='w-24' alt="Symplify Logo" />
          <CardTitle className="text-2xl font-semibold text-center">Symplify</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Enter the email address linked to your account and we will send you a link to reset your password
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full ">
                SEND LINK
              </Button>
            </form>
          </Form>
          <Button variant="link" className="w-full text-gray-500 hover:text-gray-700">
            Resend link
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            New user? <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;