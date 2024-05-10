
import React from "react";
import { useNoteContext, NoteInsert } from "../../context/NoteContext";
import {
  TextInput,
  Select,
  FileInput,
  Label,
  Button,
} from "flowbite-react";
import { useCategoryContext } from "../../context/CategoryContext";
import { useAuthContext } from "../../context/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import { useAlertContext } from "../../context/AlertContext";
  
type method = "CA" | "BT" | "CH";

const CreateNoteForm: React.FC = function () {
  const [ file, setFile] = React.useState<File | null>(null);
  const { addNote } = useNoteContext();
  const { categories } = useCategoryContext();
  const { showAlert } = useAlertContext();
  const { user } = useAuthContext();
  const [loading, setLoading] = React.useState(false);

  const [note, setNote] = React.useState<NoteInsert>({
    amount: 0,
    category_id: 1,
    media_url: "",
    method: "CA",
    status: "PENDING",
    user_id: user?.id || "",
    target: "account_balance"
  });

  const handleCreateNote = async () => {
    setLoading(true);

    // Upload file to supabase storage
    if (file) {
      // Generate a unique filename
      const filename = `${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase
        .storage
        .from("notes")
        .upload(`${filename}`, file,{
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(error);
        showAlert("Failed to upload file", "error");
        return;
      }

      note.media_url = data?.path || "";
    }

    addNote({
      ...note,
      media_url: note.media_url,
    });

    setNote({
      amount: 0,
      category_id: 1,
      media_url: "",
      method: "CA",
      status: "PENDING",
      user_id: user?.id || "",
      target: "account_balance"
    });
    setFile(null);

    showAlert("Note created successfully", "success");
    setLoading(false);
  }

  return (
    <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:p-6 xl:p-8">
      <h3 className="mb-4 text-xl font-bold dark:text-white">
        Create a new note
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
        <div>
          <Label>Amount</Label>
          <div className="mt-1">
            <TextInput
              type="number"
              value={note.amount}
              onChange={(e) => setNote({
                ...note,
                amount: parseFloat(e.target.value),
              })}
            />
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <div className="mt-1">
            <Select
              value={note.category_id}
              onChange={(e) => setNote({
                ...note,
                category_id: parseInt(e.target.value),
              })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label>Method</Label>
          <div className="mt-1">
            <Select
              value={note.method}
              onChange={(e) => setNote({
                ...note,
                method: e.target.value as method,
              })}
            >
              <option value="CA">CA</option>
              <option value="BT">BT</option>
              <option value="CH">CH</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>For</Label>
          <div className="mt-1">
            <Select
              value={note.target}
              onChange={(e) => setNote({
                ...note,
                target: e.target.value as "account_balance" | "baki",
              })}
            >
              <option value="account_balance">Account Balance</option>
              <option value="baki">Baki</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Media</Label>
          <div className="mt-1">
            {!file && (
              <div className="flex w-full items-center justify-center">
              <Label
                htmlFor="dropzone-file"
                className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <svg
                    className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>
                <FileInput id="dropzone-file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Label>
            </div>
            )}
            {file && (
              <div className="flex items-center justify-between">
                <span>{file.name}</span>
                <Button color="danger" onClick={() => setFile(null)}>Remove</Button>
              </div>
            )}
          </div>
        </div>

        <Button color="primary" onClick={handleCreateNote} disabled={loading}>
          Create Note
        </Button>
      </div>
    </div>
  );
};

export default CreateNoteForm;