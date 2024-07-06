/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Label, Modal, Table, TextInput } from "flowbite-react";
import React, { useState } from "react";
import { HiPlus } from "react-icons/hi";
import { useAlertContext } from "../../context/AlertContext";
import {
  useProductStockLogContext,
  ProductStockLogInsert,
} from "../../context/product/ProductStockLogContext";
import { Product } from "../../context/product/ProductContext";
import { useProductStockContext } from "../../context/product/ProductStockContext";

interface AddStockModalProps {
  product: Product;
}

const AddStockModal: React.FC<AddStockModalProps> = function ({ product }) {
  const [isOpen, setOpen] = useState(false);
  const [stockQuantities, setStockQuantities] = useState<{
    [key: string]: number;
  }>({});
  const { showAlert } = useAlertContext();
  const { createProductStockLog } = useProductStockLogContext();
  const { productStocks } = useProductStockContext();
  // console.log(productStocks);
  const handleAddStock = async () => {
    const stockLogs: ProductStockLogInsert[] = [];

    product?.product_colors.forEach((color) => {
      product?.product_sizes.forEach((size) => {
        const key = `${color.id}-${size.id}`;
        const quantity = stockQuantities[key] || 0;
        const productStock = productStocks.find(
          (stock) => stock.color_id === color.id && stock.size_id === size.id
        );
        if (!productStock) {
          showAlert("Failed to add stock", "error");
          return;
        }
        if (quantity === 0) return;
        stockLogs.push({
          amount: quantity,
          product_stock_id: productStock?.id,
          type: "In Stock",
        });
      });
    });
    console.log(stockLogs);
    try {      
      await Promise.all(
        stockLogs.map((stockLog) => createProductStockLog(stockLog))
      );  
      setOpen(false);
    } catch (error) {
      showAlert("Failed to add stock", "error");
    }
  };

  const handleChange = (colorId: string, sizeId: string, value: string) => {
    const key = `${colorId}-${sizeId}`;
    setStockQuantities({
      ...stockQuantities,
      [key]: parseInt(value, 10) || 0,
    });
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add Stock
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new Stock</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="flex flex-col p-4 ">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow">
                  <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <Table.Head className="bg-gray-100 dark:bg-gray-700">
                      <Table.HeadCell></Table.HeadCell>
                      {product?.product_colors.map((color) => (
                        <Table.HeadCell key={color.id}>
                          {color.color}
                        </Table.HeadCell>
                      ))}
                    </Table.Head>
                    <Table.Body>
                      {product?.product_sizes.map((size) => (
                        <Table.Row key={size.id}>
                          <Table.Cell>
                            <Label>{size.size}</Label>
                          </Table.Cell>
                          {product?.product_colors.map((color) => (
                            <Table.Cell key={`${color.id}-${size.id}`}>
                              <TextInput
                                type="number"
                                placeholder="0"
                                className="w-20"
                                onChange={(e) =>
                                  handleChange(
                                    color.id,
                                    size.id,
                                    e.target.value
                                  )
                                }
                              />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleAddStock}>
            Add Stock
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddStockModal;
