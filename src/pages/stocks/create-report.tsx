import React from "react";
import NavbarSidebarLayout from "../../layouts/navbar-sidebar";
import { useParams } from "react-router-dom";
import {
  useProductReportContext,
  ProductReportInsert,
} from "../../context/product/ProductReportContext";
import { Button, Label, TextInput, Textarea } from "flowbite-react";
import { useProductEventContext } from "../../context/product/ProductEventContext";

const CreateReportPage: React.FC = function () {
  const { createProductReport } = useProductReportContext();
  const { productId, productEventId } = useParams();
  const { updateProductEvent } = useProductEventContext();
  const [formData, setFormData] = React.useState<ProductReportInsert>({
    product_id: productId || "",
    product_event: productEventId || "",
  });

  const saveReport = async () => {
    await createProductReport(formData).then((data) => {
      if (data) {
        updateProductEvent({
          id: formData.product_event || "",
          report_id: data.id,
        }).then(() => {
          // Redirect to the user back to the previous page
          window.history.back();
        });
      }
    });
  };

  return (
    <NavbarSidebarLayout>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Create Report
              </h1>
              <a
                href="/stocks/overview"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Overview
              </a>
              <a
                href="/stocks/all"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                All Products
              </a>
              {/* Schedule */}
              <a
                href="/stocks/reports"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Reports
              </a>
              {/* Product Events */}
              <a
                href="/stocks/events"
                className="text-sm text-grey-500 dark:text-grey-400 hover:underline">
                Product Events
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 ">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle gap-4">
            <div className="overflow-auto scrollbar-hide w-full">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                Create Report
              </h1>
              <div
                className="overflow-auto hide-scrollbar"
                style={{ maxHeight: "calc(100vh - 4rem)" }}>
                {/* Company */}
                <div className="mt-4">
                  <Label>Company</Label>
                  <TextInput
                    id="company"
                    name="company"
                    placeholder="Enter company"
                    value={formData.company || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
                {/* Department */}
                <div className="mt-4">
                  <Label>Department</Label>
                  <TextInput
                    id="department"
                    name="department"
                    placeholder="Enter department"
                    value={formData.department || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>

                {/* Person in Charge */}
                <div className="mt-4">
                  <Label>Person in Charge</Label>
                  <TextInput
                    id="person_in_charge"
                    name="person_in_charge"
                    placeholder="Enter person in charge"
                    value={formData.person_in_charge || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        person_in_charge: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg mb-2">
                  Own Company
                </h3>
                {/* Department */}
                <div className="mt-4">
                  <Label>Department</Label>
                  <TextInput
                    id="department"
                    name="department"
                    placeholder="Enter department"
                    value={formData.oc_department || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oc_department: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Name */}
                <div className="mt-4">
                  <Label>Name</Label>
                  <TextInput
                    id="name"
                    name="name"
                    placeholder="Enter name"
                    value={formData.oc_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, oc_name: e.target.value })
                    }
                  />
                </div>

                {/* Reason*/}
                <div className="mt-4">
                  <Label>Reason</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Enter reason"
                    value={formData.reason || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  />
                </div>

                <Button className="mt-4" onClick={saveReport} color="primary">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavbarSidebarLayout>
  );
};

export default CreateReportPage;
