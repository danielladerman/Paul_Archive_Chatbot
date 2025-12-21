import React, { useState, useEffect } from "react";
import { GalleryImage } from "@/entities/GalleryImage";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, X, Loader2, Calendar, Tag, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { appendZl } from "@/lib/utils/index.js";

// Uploader Component
const PhotoUploader = ({ onUploadFinished, defaultCategory = "photo" }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError("Please select a photo and provide a title.");
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      const { file_url } = await UploadFile({ file });
      await GalleryImage.create({
        image_url: file_url,
        title,
        description,
        date_taken: dateTaken || null,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        category,
      });
      onUploadFinished();
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Something went wrong during the upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="photo-file">Photo or PDF</Label>
        <Input id="photo-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange} required className="border-amber-200" />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Family Picnic, 1985" required className="border-amber-200" />
      </div>
      <div>
        <Label htmlFor="description">Description or Story</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Share a memory related to this photo..." className="border-amber-200" />
      </div>
      <div>
        <Label htmlFor="date-taken">Date Taken (Optional)</Label>
        <Input id="date-taken" type="date" value={dateTaken} onChange={(e) => setDateTaken(e.target.value)} className="border-amber-200" />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., family, vacation, celebration" className="border-amber-200" />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value="photo"
              checked={category === "photo"}
              onChange={(e) => setCategory(e.target.value)}
              className="w-4 h-4 text-amber-600 border-amber-300 focus:ring-amber-500"
            />
            <span className="text-sm">Photo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value="document"
              checked={category === "document"}
              onChange={(e) => setCategory(e.target.value)}
              className="w-4 h-4 text-amber-600 border-amber-300 focus:ring-amber-500"
            />
            <span className="text-sm">Document</span>
          </label>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isUploading} className="paul-gradient">
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Upload Photo
        </Button>
      </DialogFooter>
    </form>
  );
};

// Main Gallery Page
export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("photos"); // "photos" or "documents"

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const fetchedImages = await GalleryImage.list("-created_date");
      setImages(fetchedImages);
    } catch (error) {
      console.error("Error loading images:", error);
    }
    setIsLoading(false);
  };

  const handleUploadFinished = () => {
    setIsUploaderOpen(false);
    loadImages();
  };

  // Filter images based on active tab using category field
  const photoImages = images.filter(img => (img.category || "photo") === "photo");
  const documentImages = images.filter(img => img.category === "document");
  const displayedImages = activeTab === "photos" ? photoImages : documentImages;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="paul-card rounded-2xl p-6 md:p-8 paul-glow">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ImageIcon className="w-8 h-8 paul-text-gradient" />
            <h1 className="text-3xl font-light paul-text-gradient">{appendZl("Photo & Documents Gallery")}</h1>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {appendZl("A collection of cherished moments from Paul's life. Feel free to contribute your own photos to help grow this visual history.")}
          </p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-2 mb-6">
        <Button
          onClick={() => setActiveTab("photos")}
          variant={activeTab === "photos" ? "default" : "outline"}
          className={activeTab === "photos" ? "paul-gradient" : "border-amber-200 hover:bg-amber-50"}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Photos ({photoImages.length})
        </Button>
        <Button
          onClick={() => setActiveTab("documents")}
          variant={activeTab === "documents" ? "default" : "outline"}
          className={activeTab === "documents" ? "paul-gradient" : "border-amber-200 hover:bg-amber-50"}
        >
          <FileText className="mr-2 h-4 w-4" />
          Documents ({documentImages.length})
        </Button>
      </div>

      {/* Add Photo/Document Button */}
      <div className="text-center mb-8">
        <Button onClick={() => setIsUploaderOpen(true)} className="paul-gradient paul-glow">
          <Plus className="mr-2 h-4 w-4" /> Add a {activeTab === "photos" ? "Photo" : "Document"}
        </Button>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-200/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : displayedImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {displayedImages.map((image) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedImage(image)}
                className="aspect-w-1 aspect-h-1 cursor-pointer"
              >
                <Card className="overflow-hidden paul-card hover:paul-glow transition-all duration-300 group flex items-center justify-center">
                  {image.image_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <FileText className="w-12 h-12" />
                      <span className="text-xs text-center font-semibold px-2">{image.title}</span>
                    </div>
                  ) : (
                    <img src={image.image_url} alt={image.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white font-medium text-sm truncate">{image.title}</h3>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16 paul-card rounded-lg">
            {activeTab === "photos" ? (
              <>
                <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-lg font-medium text-slate-800">No photos yet</h3>
                <p className="mt-1 text-sm text-slate-500">{appendZl("Be the first to add a photo to Paul's memorial.")}</p>
              </>
            ) : (
              <>
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-lg font-medium text-slate-800">No documents yet</h3>
                <p className="mt-1 text-sm text-slate-500">{appendZl("Be the first to add a document to Paul's memorial.")}</p>
              </>
            )}
        </div>
      )}

      {/* Uploader Modal */}
      <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
        <DialogContent className="sm:max-w-[425px] paul-card">
          <DialogHeader>
            <DialogTitle>Add a {activeTab === "photos" ? "Photo" : "Document"} to the Gallery</DialogTitle>
          </DialogHeader>
          <PhotoUploader onUploadFinished={handleUploadFinished} defaultCategory={activeTab === "photos" ? "photo" : "document"} />
        </DialogContent>
      </Dialog>
      
      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-2 md:p-4 paul-card">
          {selectedImage && (
            <>
              {selectedImage.image_url.toLowerCase().endsWith('.pdf') ? (
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-light paul-text-gradient mb-4">{selectedImage.title}</h2>
                  <p className="text-slate-700 mb-6">{appendZl(selectedImage.description)}</p>
                  <Button asChild className="paul-gradient">
                    <a href={selectedImage.image_url} target="_blank" rel="noopener noreferrer">
                      Open PDF in new tab
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <img src={selectedImage.image_url} alt={selectedImage.title} className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
                    </div>
                    <div className="p-4 flex flex-col">
                        <h2 className="text-2xl font-light paul-text-gradient mb-4">{selectedImage.title}</h2>
                        {selectedImage.description && <p className="text-slate-700 leading-relaxed mb-4">{appendZl(selectedImage.description)}</p>}
                        
                        <div className="mt-auto space-y-3 pt-4 border-t border-amber-200/50">
                            {selectedImage.date_taken && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Taken around {format(new Date(selectedImage.date_taken), "MMMM yyyy")}</span>
                                </div>
                            )}
                            {selectedImage.tags && selectedImage.tags.length > 0 && (
                                <div className="flex items-start gap-2 text-sm text-slate-600">
                                    <Tag className="w-4 h-4 mt-1" />
                                    <div className="flex flex-wrap gap-1">
                                        {selectedImage.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}