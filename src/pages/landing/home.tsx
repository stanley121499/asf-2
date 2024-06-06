import React from "react";
// import BottomNav from "../components/bottom-nav";
import NavbarHome from "../../components/navbar-home";
import OriginalFooterOfFlowbite from "../../components/home/original-footer-of-Flowbite";

const HomePage: React.FC = () => {

  return (
    <>
      <NavbarHome />
      {/* <BackgroundImageCards />
      <CardsWithGridLayoutAndCTA />
      <HeadingWithCTAButton />
      <OverlayCardsWithZoomEffect /> */}
      {/* <BottomNav /> */}
      <OriginalFooterOfFlowbite />
    </>
  );
}

export default HomePage;