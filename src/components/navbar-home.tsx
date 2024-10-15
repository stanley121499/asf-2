"use client";
import { Navbar } from "flowbite-react";
import React from "react";
import { Link } from "react-router-dom";

const NavbarHome: React.FC = () => {
  return (
    <Navbar
      fluid
      rounded
      className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-none border-b dark:border-gray-700 transition-colors duration-200 p-4">
      <Navbar.Brand as={Link} href="https://flowbite-react.com">
        <img alt="Logo" src="../../images/logo.svg" className="mr-3 h-10" />
        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
          ASF
        </span>
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Navbar.Link href="/" active>
          Home
        </Navbar.Link>
        {/* <Navbar.Link as={Link} href="#">
          About
        </Navbar.Link> */}
        <Navbar.Link href="/cart">Cart</Navbar.Link>
        <Navbar.Link href="/product-section">Products</Navbar.Link>
        {/* <Navbar.Link href="#">Pricing</Navbar.Link>
        <Navbar.Link href="#">Contact</Navbar.Link> */}
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavbarHome;
