import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type HomePageElement =
  Database["public"]["Tables"]["homepage_elements"]["Row"];
export type HomePageElements = { elements: HomePageElement[] };
export type HomePageElementInsert =
  Database["public"]["Tables"]["homepage_elements"]["Insert"];
export type HomePageElementUpdate =
  Database["public"]["Tables"]["homepage_elements"]["Update"];

interface HomePageElementContextProps {
  elements: HomePageElement[];
  createElement: (element: HomePageElementInsert) => Promise<void>;
  updateElement: (element: HomePageElementUpdate) => Promise<void>;
  deleteElement: (elementId: string) => Promise<void>;
  loading: boolean;
}

const HomePageElementContext = createContext<HomePageElementContextProps>(
  undefined!
);

export function HomePageElementProvider({ children }: PropsWithChildren<{}>) {
  const [elements, setElements] = useState<HomePageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchElements = async () => {
      const { data: elements, error } = await supabase
        .from("homepage_elements")
        .select("*")
        .order("arrangement", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setElements(elements);
    };

    fetchElements();

    const handleChanges = (payload: any) => {
      if (payload.eventType === "INSERT") {
        setElements((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setElements((prev) =>
          prev.map((element) =>
            element.id === payload.new.id ? payload.new : element
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setElements((prev) =>
          prev.filter((element) => element.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("homepage_elements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homepage_elements" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createElement = async (element: HomePageElementInsert) => {
    const { error } = await supabase.from("homepage_elements").insert(element);

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Element created successfully", "success");
  };

  const updateElement = async (element: HomePageElementUpdate) => {
    const { error } = await supabase
      .from("homepage_elements")
      .update(element)
      .match({ id: element.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Element updated successfully", "success");
  };

  const deleteElement = async (elementId: string) => {
    const { error } = await supabase
      .from("homepage_elements")
      .delete()
      .match({ id: elementId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Element deleted successfully", "success");
  };

  return (
    <HomePageElementContext.Provider
      value={{
        elements,
        createElement,
        updateElement,
        deleteElement,
        loading,
      }}>
      {children}
    </HomePageElementContext.Provider>
  );
}

export function useHomePageElementContext() {
  const context = useContext(HomePageElementContext);
  if (!context) {
    throw new Error(
      "useHomePageElementContext must be used within a HomePageElementProvider"
    );
  }
  return context;
}
