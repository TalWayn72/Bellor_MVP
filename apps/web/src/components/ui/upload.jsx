import * as React from "react"
import { Upload as UploadIcon, X, Image, File, Camera } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "./button"

/**
 * Upload Component - Bellor Design System
 *
 * File upload with drag & drop support
 */
const uploadVariants = cva(
  "relative rounded-2xl border-2 border-dashed transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border hover:border-primary/50 bg-muted/30",
        active: "border-primary bg-primary/5",
        error: "border-destructive bg-destructive/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Upload = React.forwardRef(({
  accept = "image/*",
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 6,
  onUpload,
  onError,
  className,
  children,
  ...props
}, ref) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const [files, setFiles] = React.useState([])
  const inputRef = React.useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const validFiles = []
    const errors = []

    newFiles.forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`)
        return
      }

      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0 && onError) {
      onError(errors)
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
      setFiles(updatedFiles)
      if (onUpload) {
        onUpload(updatedFiles)
      }
    }
  }

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    if (onUpload) {
      onUpload(updatedFiles)
    }
  }

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          uploadVariants({ variant: isDragging ? "active" : "default" }),
          "cursor-pointer p-8"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        {children || (
          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UploadIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept === "image/*" ? "PNG, JPG, GIF" : "Any file type"} up to {maxSize / 1024 / 1024}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {files.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
})
Upload.displayName = "Upload"

// File preview component
const FilePreview = ({ file, onRemove }) => {
  const [preview, setPreview] = React.useState(null)

  React.useEffect(() => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)

      // Cleanup: abort file reading if component unmounts
      return () => {
        reader.abort()
      }
    }
  }, [file])

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
      {preview ? (
        <img src={preview} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <File className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Avatar upload variant
const AvatarUpload = React.forwardRef(({
  value,
  onChange,
  size = "lg",
  className,
  ...props
}, ref) => {
  const inputRef = React.useRef(null)
  const [preview, setPreview] = React.useState(value)

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-20 w-20",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        if (onChange) {
          onChange(file)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      ref={ref}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative rounded-full overflow-hidden bg-muted cursor-pointer group",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {preview ? (
        <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="h-6 w-6 text-white" />
      </div>
    </div>
  )
})
AvatarUpload.displayName = "AvatarUpload"

export { Upload, AvatarUpload, uploadVariants }
