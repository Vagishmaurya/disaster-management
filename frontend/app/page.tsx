"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, AlertTriangle, Users, MessageSquare, ImageIcon, Globe, Edit, Trash2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/useSocket"
import { useDisasters, useReports } from "@/hooks/useApi"
import { apiClient } from "@/lib/api"
import { ConnectionStatus } from "@/components/ConnectionStatus"

interface Disaster {
  id: string
  title: string
  location_name: string
  location: { lat: number; lng: number }
  description: string
  tags: string[]
  owner_id: string
  created_at: string
  audit_trail: any[]
}

interface Report {
  id: string
  disaster_id: string
  user_id: string
  content: string
  image_url?: string
  verification_status: "pending" | "verified" | "rejected"
  created_at: string
}

interface Resource {
  id: string
  disaster_id: string
  name: string
  location_name: string
  location: { lat: number; lng: number }
  type: string
  created_at: string
}

export default function DisasterResponsePlatform() {
  const [resources, setResources] = useState<Resource[]>([])
  const [socialMedia, setSocialMedia] = useState<any[]>([])
  const [officialUpdates, setOfficialUpdates] = useState<any[]>([])
  const [selectedDisaster, setSelectedDisaster] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [editingDisaster, setEditingDisaster] = useState<Disaster | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [disasterToDelete, setDisasterToDelete] = useState<Disaster | null>(null)
  const { toast } = useToast()

  // Use custom hooks for API calls
  const {
    disasters,
    loading: disastersLoading,
    error: disastersError,
    fetchDisasters,
    createDisaster,
    updateDisaster,
    deleteDisaster,
  } = useDisasters()

  const { reports, loading: reportsLoading, error: reportsError, fetchReports, createReport } = useReports()

  // Socket.IO integration
  const {
    socket,
    joinDisasterRoom,
    leaveDisasterRoom,
    onDisasterUpdated,
    onDisasterDeleted,
    onSocialMediaUpdated,
    onResourcesUpdated,
    offDisasterUpdated,
    offDisasterDeleted,
    offSocialMediaUpdated,
    offResourcesUpdated,
  } = useSocket()

  // Form states
  const [newDisaster, setNewDisaster] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: "",
  })
  const [newReport, setNewReport] = useState({
    content: "",
    image_url: "",
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: "",
  })

  // Socket event handlers
  useEffect(() => {
    const handleDisasterUpdated = (data: any) => {
      toast({
        title: "Disaster Updated",
        description: `Disaster "${data.title}" has been ${data.action}`,
      })
      fetchDisasters()
    }

    const handleDisasterDeleted = (data: any) => {
      toast({
        title: "Disaster Deleted",
        description: `Disaster "${data.title}" has been deleted`,
      })
      fetchDisasters()
      if (selectedDisaster === data.id) {
        setSelectedDisaster("")
      }
    }

    const handleSocialMediaUpdated = (data: any) => {
      toast({
        title: "New Social Media Reports",
        description: `${data.count} new reports found`,
      })
      if (selectedDisaster) {
        fetchSocialMedia(selectedDisaster)
      }
    }

    const handleResourcesUpdated = (data: any) => {
      toast({
        title: "Resources Updated",
        description: `New resources available`,
      })
      if (selectedDisaster) {
        fetchResources(selectedDisaster)
      }
    }

    // Set up event listeners
    onDisasterUpdated(handleDisasterUpdated)
    onDisasterDeleted(handleDisasterDeleted)
    onSocialMediaUpdated(handleSocialMediaUpdated)
    onResourcesUpdated(handleResourcesUpdated)

    // Cleanup
    return () => {
      offDisasterUpdated(handleDisasterUpdated)
      offDisasterDeleted(handleDisasterDeleted)
      offSocialMediaUpdated(handleSocialMediaUpdated)
      offResourcesUpdated(handleResourcesUpdated)
    }
  }, [
    selectedDisaster,
    toast,
    fetchDisasters,
    onDisasterUpdated,
    onDisasterDeleted,
    onSocialMediaUpdated,
    onResourcesUpdated,
    offDisasterUpdated,
    offDisasterDeleted,
    offSocialMediaUpdated,
    offResourcesUpdated,
  ])

  // Join/leave disaster rooms when selection changes
  useEffect(() => {
    if (!selectedDisaster) return

    // Debounce join/leave disaster room socket emits to prevent multiple rapid calls
    const debounceDelay = 300
    let debounceTimer: NodeJS.Timeout

    debounceTimer = setTimeout(() => {
      let currentRoom = selectedDisaster
      joinDisasterRoom(currentRoom)
    }, debounceDelay)

    return () => {
      clearTimeout(debounceTimer)
      leaveDisasterRoom(selectedDisaster)
    }
  }, [selectedDisaster, joinDisasterRoom, leaveDisasterRoom])

  // Fetch functions for disaster-specific data
  const fetchSocialMedia = async (disasterId: string) => {
    try {
      const data = await apiClient.getSocialMedia(disasterId)
      setSocialMedia(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch social media:", error)
      setSocialMedia([])
    }
  }

  const fetchResources = async (disasterId: string) => {
    try {
      const data = await apiClient.getResources(disasterId)
      setResources(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch resources:", error)
      setResources([])
    }
  }

  const fetchOfficialUpdates = async (disasterId: string) => {
    try {
      const data = await apiClient.getOfficialUpdates(disasterId)
      setOfficialUpdates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch official updates:", error)
      setOfficialUpdates([])
    }
  }

  // Create disaster with backend API
  const handleCreateDisaster = async () => {
    setLoading(true)
    try {
      await createDisaster({
        ...newDisaster,
              tags: newDisaster.tags
                .split(",")
                .map((tag: string) => tag.trim())
                .filter(Boolean),
        owner_id: "netrunnerX",
      })

      toast({
        title: "Success",
        description: "Disaster created successfully",
      })
      setNewDisaster({ title: "", location_name: "", description: "", tags: "" })
      fetchDisasters()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create disaster",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update disaster
  const handleUpdateDisaster = async () => {
    if (!editingDisaster) return

    setLoading(true)
    try {
      await updateDisaster(editingDisaster.id, {
        ...editForm,
            tags: editForm.tags
              .split(",")
              .map((tag: string) => tag.trim())
              .filter(Boolean),
        user_id: "netrunnerX",
      })

      toast({
        title: "Success",
        description: "Disaster updated successfully",
      })
      setEditingDisaster(null)
      fetchDisasters()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update disaster",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete disaster
  const handleDeleteDisaster = async () => {
    if (!disasterToDelete) return

    setLoading(true)
    try {
      await deleteDisaster(disasterToDelete.id, "netrunnerX")

      toast({
        title: "Success",
        description: "Disaster deleted successfully",
      })
      setDeleteDialogOpen(false)
      setDisasterToDelete(null)
      fetchDisasters()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete disaster",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Start editing disaster
  const startEditing = (disaster: Disaster) => {
    setEditingDisaster(disaster)
    setEditForm({
      title: disaster.title,
      location_name: disaster.location_name,
      description: disaster.description,
      tags: disaster.tags.join(", "),
    })
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingDisaster(null)
    setEditForm({ title: "", location_name: "", description: "", tags: "" })
  }

  // Create report
  const handleCreateReport = async () => {
    if (!selectedDisaster) {
      toast({
        title: "Error",
        description: "Please select a disaster first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await createReport({
        ...newReport,
        disaster_id: selectedDisaster,
        user_id: "citizen1",
      })

      toast({
        title: "Success",
        description: "Report submitted successfully",
      })
      setNewReport({ content: "", image_url: "" })
      fetchReports({ disaster_id: selectedDisaster })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Verify image
  const verifyImage = async (reportId: string, imageUrl: string) => {
    setLoading(true)
    try {
      const data = await apiClient.verifyImage(selectedDisaster, {
        image_url: imageUrl,
        report_id: reportId,
      })

      toast({
        title: "Image Verification",
        description: data.verification_result || "Image verification completed",
      })
      fetchReports({ disaster_id: selectedDisaster })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify image",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchDisasters()
  }, [fetchDisasters])

  // Load disaster-specific data when selection changes
  useEffect(() => {
    if (!selectedDisaster) return
    console.log('Use Effect triggered for selectedDisaster:', selectedDisaster);
    // Debounce or throttle API calls to prevent multiple calls on rapid selection changes
    const timeoutId = setTimeout(() => {
      fetchSocialMedia(selectedDisaster)
      fetchResources(selectedDisaster)
      fetchOfficialUpdates(selectedDisaster)
      fetchReports({ disaster_id: selectedDisaster })
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timeoutId)
  }, [selectedDisaster])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            {process.env.NEXT_PUBLIC_APP_NAME || "Disaster Response Platform"}
          </h1>
          <ConnectionStatus />
        </div>
        <p className="text-muted-foreground">
          Real-time disaster management with AI-powered location extraction and geospatial analysis
        </p>
        <p className="text-xs text-muted-foreground">
          Connected to: {process.env.NEXT_PUBLIC_API_URL} | Version: {process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>

      {(disastersError || reportsError) && (
        <Alert variant="destructive">
          <AlertDescription>{disastersError || reportsError}. Please check your backend connection.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="disasters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="disasters">Disasters</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="updates">Official Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="disasters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Disaster</CardTitle>
              <CardDescription>
                Location will be extracted from description using AI and geocoded automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Disaster Title"
                value={newDisaster.title}
                onChange={(e) => setNewDisaster({ ...newDisaster, title: e.target.value })}
              />
              <Input
                placeholder="Location Name (optional - will be extracted from description)"
                value={newDisaster.location_name}
                onChange={(e) => setNewDisaster({ ...newDisaster, location_name: e.target.value })}
              />
              <Textarea
                placeholder="Disaster Description (include location details for AI extraction)"
                value={newDisaster.description}
                onChange={(e) => setNewDisaster({ ...newDisaster, description: e.target.value })}
              />
              <Input
                placeholder="Tags (comma-separated: flood, earthquake, urgent)"
                value={newDisaster.tags}
                onChange={(e) => setNewDisaster({ ...newDisaster, tags: e.target.value })}
              />
              <Button onClick={handleCreateDisaster} disabled={loading || disastersLoading}>
                {loading ? "Creating..." : "Create Disaster"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {disastersLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading disasters...</p>
                </CardContent>
              </Card>
            ) : Array.isArray(disasters) && disasters.length > 0 ? (
              disasters.map((disaster) => (
                <Card key={disaster.id} className={selectedDisaster === disaster.id ? "ring-2 ring-blue-500" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingDisaster?.id === disaster.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              placeholder="Disaster Title"
                            />
                            <Input
                              value={editForm.location_name}
                              onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                              placeholder="Location Name"
                            />
                            <Textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              placeholder="Description"
                            />
                            <Input
                              value={editForm.tags}
                              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                              placeholder="Tags (comma-separated)"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateDisaster} disabled={loading}>
                                <Save className="h-4 w-4 mr-1" />
                                {loading ? "Saving..." : "Save"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <CardTitle className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {disaster.title}
                            </CardTitle>
                            <CardDescription>{disaster.location_name}</CardDescription>
                          </>
                        )}
                      </div>
                      {editingDisaster?.id !== disaster.id && (
                        <div className="flex gap-2">
                          <Button
                            variant={selectedDisaster === disaster.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (selectedDisaster !== disaster.id) {
                                setSelectedDisaster(disaster.id)
                              }
                            }}
                          >
                            {selectedDisaster === disaster.id ? "Selected" : "Select"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditing(disaster)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDisasterToDelete(disaster)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {editingDisaster?.id !== disaster.id && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{disaster.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.isArray(disaster.tags) &&
                          disaster.tags.map((tag : any) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created by {disaster.owner_id} on {new Date(disaster.created_at).toLocaleDateString()}
                      </p>
                      {disaster.location && (
                        <p className="text-xs text-muted-foreground">
                          Coordinates: {disaster.location.lat?.toFixed(4)}, {disaster.location.lng?.toFixed(4)}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No disasters found. Create one to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {selectedDisaster ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Submit Report</CardTitle>
                  <CardDescription>Report information about the selected disaster</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Report content"
                    value={newReport.content}
                    onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                  />
                  <Input
                    placeholder="Image URL (optional)"
                    value={newReport.image_url}
                    onChange={(e) => setNewReport({ ...newReport, image_url: e.target.value })}
                  />
                  <Button onClick={handleCreateReport} disabled={loading || reportsLoading}>
                    {loading ? "Submitting..." : "Submit Report"}
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {reportsLoading ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">Loading reports...</p>
                    </CardContent>
                  </Card>
                ) : Array.isArray(reports) && reports.length > 0 ? (
                  reports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant={
                              report.verification_status === "verified"
                                ? "default"
                                : report.verification_status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {report.verification_status}
                          </Badge>
                          {report.image_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyImage(report.id, report.image_url!)}
                              disabled={loading}
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              Verify Image
                            </Button>
                          )}
                        </div>
                        <p className="text-sm mb-2">{report.content}</p>
                        {report.image_url && (
                          <img
                            src={report.image_url || "/placeholder.svg"}
                            alt="Report"
                            className="w-32 h-32 object-cover rounded mb-2"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          By {report.user_id} on {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No reports found for this disaster.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Alert>
              <AlertDescription>Please select a disaster to view and submit reports.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          {selectedDisaster ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Social Media Reports
                  </CardTitle>
                  <CardDescription>Real-time social media monitoring for disaster updates</CardDescription>
                </CardHeader>
              </Card>
              {Array.isArray(socialMedia) && socialMedia.length > 0 ? (
                socialMedia.map((post, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">@{post.user}</Badge>
                        <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                      </div>
                      <p className="text-sm">{post.content}</p>
                      {post.priority && (
                        <Badge variant="destructive" className="mt-2">
                          Priority Alert
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No social media reports found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>Please select a disaster to view social media reports.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {selectedDisaster ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Nearby Resources
                  </CardTitle>
                  <CardDescription>Geospatially mapped resources within 10km</CardDescription>
                </CardHeader>
              </Card>
              {Array.isArray(resources) && resources.length > 0 ? (
                resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{resource.name}</h4>
                        <Badge variant="outline">{resource.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{resource.location_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Coordinates: {resource.location.lat.toFixed(4)}, {resource.location.lng.toFixed(4)}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No resources found nearby.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>Please select a disaster to view nearby resources.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          {selectedDisaster ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Official Updates
                  </CardTitle>
                  <CardDescription>Government and relief organization updates</CardDescription>
                </CardHeader>
              </Card>
              {Array.isArray(officialUpdates) && officialUpdates.length > 0 ? (
                officialUpdates.map((update, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{update.source}</Badge>
                        <span className="text-xs text-muted-foreground">{update.timestamp}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{update.title}</h4>
                      <p className="text-sm text-muted-foreground">{update.content}</p>
                      {update.url && (
                        <a
                          href={update.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Read more
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No official updates available.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>Please select a disaster to view official updates.</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Disaster</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{disasterToDelete?.title}"? This action will mark the disaster as deleted
              in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDisaster} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
