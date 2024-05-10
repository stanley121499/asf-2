import React from "react";
// import BottomNav from "../components/bottom-nav";
import NavbarHome from "../../components/navbar-home";
import BackgroundImageCards from "../../components/home/background-image-cards";
import OverlayCardsWithZoomEffect from "../../components/home/overlay-cards-with-zoom-effect";
import HeadingWithCTAButton from "../../components/home/heading-with-CTA-button";
import CardsWithGridLayoutAndCTA from "../../components/home/cards-with-grid-layout-and-CTA";
import OriginalFooterOfFlowbite from "../../components/home/original-footer-of-Flowbite";

const HomePage: React.FC = () => {

  return (
    <>
      <NavbarHome />
      <BackgroundImageCards />
      <CardsWithGridLayoutAndCTA />
      <HeadingWithCTAButton />
      <OverlayCardsWithZoomEffect />
      {/* <BottomNav /> */}
      <OriginalFooterOfFlowbite />
    </>
  );
}

export default HomePage;