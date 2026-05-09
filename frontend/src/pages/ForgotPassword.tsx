import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailValue = watch("email");

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Failed to send reset email";
        setApiError(errorMessage);
        throw new Error(errorMessage);
      }

      setEmailSent(true);
      toast({
        title: "Email sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to send reset email";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to {emailValue}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                The reset link will expire in 15 minutes for security reasons.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, check your spam folder.
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {apiError}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="text-sm text-primary hover:underline font-medium"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
