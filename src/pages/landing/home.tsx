import React from "react";
// import BottomNav from "../components/bottom-nav";
import NavbarHome from "../../components/navbar-home";
import OriginalFooterOfFlowbite from "../../components/home/original-footer-of-Flowbite";
import { useHomePageElementContext } from "../../context/HomePageElementContext";
import HomePageProductComponent from "./components/Product";
import HomePageCategoryComponent from "./components/Category";
import BackgroundImageCards from "../../components/home/background-image-cards";

const HomePage: React.FC = () => {
  const { elements } = useHomePageElementContext();

  return (
    <>
      <NavbarHome />
      {/* <BackgroundImageCards /> */}
      {/* <CardsWithGridLayoutAndCTA />
      <HeadingWithCTAButton />
      <OverlayCardsWithZoomEffect /> */}
      {/* <BottomNav /> */}
      <section className="bg-white dark:bg-gray-900">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
          {elements &&
            elements.map((element) => {
              switch (element.type) {
                case "category":
                  return (
                    <HomePageCategoryComponent
                      key={element.id}
                      targetId={element.targetId}
                      amount={element.amount}
                      contentType={element.contentType}
                    />
                  );

                case "product":
                  return (
                    <HomePageProductComponent
                      key={element.id}
                      targetId={element.targetId}
                      amount={element.amount}
                      contentType={element.contentType}
                    />
                  );
                default:
                  return null;
              }
            })}
        </div>
      </section>
      <OriginalFooterOfFlowbite />
    </>
  );
};

export default HomePage;
