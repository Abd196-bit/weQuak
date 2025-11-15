'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  isSignUp: boolean;
  onSubmit: (data: z.infer<any>) => Promise<void>;
  isLoading: boolean;
}

const formSchema = z.object({
  username: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signUpSchema = formSchema.extend({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
});

export default function AuthForm({ isSignUp, onSubmit, isLoading }: AuthFormProps) {
  const currentSchema = isSignUp ? signUpSchema : formSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Create an account' : 'Welcome back!'}</CardTitle>
        <CardDescription>
          {isSignUp ? 'Enter your details to join We Quack.' : 'Sign in to continue to We Quack.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your cool username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Log In'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link href={isSignUp ? '/login' : '/signup'} className="underline text-primary">
            {isSignUp ? 'Log in' : 'Sign up'}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
