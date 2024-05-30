/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Card, Checkbox, Label, TextInput } from "flowbite-react";
import type { FC } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import LoadingPage from "../pages/loading";
import { useAuthContext } from "../../context/AuthContext";


const SignInPage: FC = function () {
  const navigate = useNavigate(); // Use useNavigate from react-router-dom
  const { signIn, user, loading } = useAuthContext(); // Use signIn from useSupabaseAuth

  // Assume you've defined a state htmlFor email and password to capture form inputs
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(''); // Assume you've defined a state to capture errors [optional]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    const email = username
    const result = await signIn(email, password);

    // Handle sign-in errors
    if (result.error) {
      console.error('Sign in error:', result.error.message);
      setError(result.error.message);
    } else {
      navigate('/dashboard'); // Redirect to dashboard after successful sign-in
    }
  }

  if (loading) {
    return <LoadingPage />;
  } else if (user) {
    navigate('/dashboard'); // Redirect to dashboard if user is already signed in
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 lg:h-screen lg:gap-y-12">
      <a href="/" className="my-6 flex items-center gap-x-1 lg:my-0">
        <img
          alt="Logo"
          src="../../images/logo.svg"
          className="mr-3 h-10"
        />
        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
          ASF
        </span>
      </a>
      <Card
        horizontal
        imgSrc="/images/authentication/login.jpg"
        imgAlt=""
        className="w-full md:max-w-[1024px] md:[&>*]:w-full md:[&>*]:p-16 [&>img]:hidden md:[&>img]:w-96 md:[&>img]:p-0 lg:[&>img]:block"
      >
        <h1 className="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
          Sign in to platform
        </h1>
        {error && ( 
            <div className="mb-6 p-3 text-sm text-center text-red-500 bg-red-100 dark:bg-red-500 dark:text-red-100">
              {error}
            </div>
          )}
        <form>
          <div className="mb-4 flex flex-col gap-y-3">
            <Label htmlFor="email">Your Username</Label>
            <TextInput
              id="email"
              name="email"
              placeholder="username123"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-6 flex flex-col gap-y-3">
            <Label htmlFor="password">Your password</Label>
            <TextInput
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {/* <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Checkbox id="rememberMe" name="rememberMe" />
              <Label htmlFor="rememberMe">Remember me</Label>
            </div>
            <a
              href="#"
              className="w-1/2 text-right text-sm text-primary-600 dark:text-primary-300"
            >
              Lost Password?
            </a>
          </div> */}
          <div className="mb-6">
            <Button type="submit" className="w-full lg:w-auto" onClick={handleLogin}>
              Login to your account
            </Button>
          </div>
          
          {/* <p className="text-sm text-gray-500 dark:text-gray-300">
            Not registered?&nbsp;
            <a href="#" className="text-primary-600 dark:text-primary-300">
              Create account
            </a>
          </p> */}
        </form>
      </Card>
    </div>
  );
};

export default SignInPage;
