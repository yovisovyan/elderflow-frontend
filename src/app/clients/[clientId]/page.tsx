"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProtectedLayout from "../../protected-layout";

import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Client = {
  id: string;
  name: string;
  status: string;
  billingContactName?: string | null;
  billingContactEmail?: string | null;

  primaryCM?: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  } | null;
};

type ActivityApi = {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string | null;
  serviceType?: { name?: string | null } | null;
  isBillable?: boolean;
};

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | string;

type InvoiceApi = {
  id: string;
  totalAmount: number;
  status: InvoiceStatus;
  periodEnd: string;
};

type Note = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName?: string | null;
};

type ClientContact = {
  id: string;
  name: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isEmergencyContact: boolean;
  createdAt: string;
};

type ClientProvider = {
  id: string;
  type: string; // physician, therapist, attorney, facility, etc.
  name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
};

type ClientMedication = {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  prescribingProvider?: string | null;
  notes?: string | null;
  createdAt: string;
};

type ClientAllergy = {
  id: string;
  allergen: string;
  reaction?: string | null;
  severity?: string | null;
  notes?: string | null;
  createdAt: string;
};

type ClientInsurance = {
  id: string;
  insuranceType?: string | null;
  carrier?: string | null;
  policyNumber?: string | null;
  groupNumber?: string | null;
  memberId?: string | null;
  phone?: string | null;
  notes?: string | null;
  primary: boolean;
  createdAt: string;
};

type ClientRisk = {
  id: string;
  category: string;
  severity?: string | null;
  notes?: string | null;
  createdAt: string;
};

type ClientDocument = {
  id: string;
  title: string;
  fileUrl: string;
  fileType?: string | null;
  category?: string | null;
  uploadedAt: string;
  createdAt: string;
};

type CarePlan = {
  id: string;
  title: string;
  status: string; // "active", "completed", "archived"
  startDate?: string | null;
  targetDate?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CarePlanGoal = {
  id: string;
  carePlanId: string;
  title: string;
  description?: string | null;
  status: string; // "active", "completed", "deferred"
  priority?: string | null; // "low", "medium", "high"
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProgressNote = {
  id: string;
  date: string;
  noteType?: string | null;
  content: string;
  authorId: string;
  authorName?: string | null;
  carePlanId?: string | null;
  carePlanTitle?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditLogEntry = {
  id: string;
  entityType: string; // "medication" | "risk" | future
  entityId?: string | null;
  action: string; // "create" | "update" | "delete"
  details?: string | null;
  createdAt: string;
  userName?: string | null;
};




export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const clientId = params.clientId;

  const [client, setClient] = useState<Client | null>(null);
  const [clientError, setClientError] = useState("");
  const [clientLoading, setClientLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityApi[]>([]);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityApi[]>([]);

  const [invoices, setInvoices] = useState<InvoiceApi[]>([]);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCareManager, setIsCareManager] = useState(false);

    // Tabs: overview | care | profile
  type TabKey = "overview" | "care" | "profile";

  const [activeTab, setActiveTab] = useState<TabKey>("overview");


  // Contacts state
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRelationship, setNewContactRelationship] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");
  const [newContactNotes, setNewContactNotes] = useState("");
  const [newContactIsEmergency, setNewContactIsEmergency] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);

  // Contact details modal state
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(
    null
  );

  function openContactDetails(contact: ClientContact) {
    setSelectedContact(contact);
    setContactDetailsOpen(true);
  }

  function closeContactDetails() {
    setContactDetailsOpen(false);
    setSelectedContact(null);
  }

  // Providers state
  const [providers, setProviders] = useState<ClientProvider[]>([]);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);

  const [newProviderType, setNewProviderType] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderSpecialty, setNewProviderSpecialty] = useState("");
  const [newProviderPhone, setNewProviderPhone] = useState("");
  const [newProviderEmail, setNewProviderEmail] = useState("");
  const [newProviderAddress, setNewProviderAddress] = useState("");
  const [newProviderNotes, setNewProviderNotes] = useState("");
  const [savingProvider, setSavingProvider] = useState(false);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  // Provider details modal state
  const [providerDetailsOpen, setProviderDetailsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ClientProvider | null>(null);

  function openProviderDetails(provider: ClientProvider) {
    setSelectedProvider(provider);
    setProviderDetailsOpen(true);
  }

  function closeProviderDetails() {
    setProviderDetailsOpen(false);
    setSelectedProvider(null);
  }

  // Medications state
  const [medications, setMedications] = useState<ClientMedication[]>([]);
  const [medicationsError, setMedicationsError] = useState<string | null>(null);
  const [medicationsLoading, setMedicationsLoading] = useState(true);

  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFrequency, setNewMedFrequency] = useState("");
  const [newMedRoute, setNewMedRoute] = useState("");
  const [newMedPrescribingProvider, setNewMedPrescribingProvider] =
    useState("");
  const [newMedNotes, setNewMedNotes] = useState("");
  const [savingMedication, setSavingMedication] = useState(false);
  const [medicationMessage, setMedicationMessage] = useState<string | null>(
    null
  );

  // Medication details modal state
  const [medDetailsOpen, setMedDetailsOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<ClientMedication | null>(null);

  function openMedDetails(med: ClientMedication) {
    setSelectedMed(med);
    setMedDetailsOpen(true);
  }

  function closeMedDetails() {
    setMedDetailsOpen(false);
    setSelectedMed(null);
  }

    // Allergies state
  const [allergies, setAllergies] = useState<ClientAllergy[]>([]);
  const [allergiesError, setAllergiesError] = useState<string | null>(null);
  const [allergiesLoading, setAllergiesLoading] = useState(true);

  const [newAllergen, setNewAllergen] = useState("");
  const [newAllergyReaction, setNewAllergyReaction] = useState("");
  const [newAllergySeverity, setNewAllergySeverity] = useState("");
  const [newAllergyNotes, setNewAllergyNotes] = useState("");
  const [savingAllergy, setSavingAllergy] = useState(false);
  const [allergyMessage, setAllergyMessage] = useState<string | null>(null);

  // Allergy details modal state
  const [allergyDetailsOpen, setAllergyDetailsOpen] = useState(false);
  const [selectedAllergy, setSelectedAllergy] =
    useState<ClientAllergy | null>(null);

  function openAllergyDetails(allergy: ClientAllergy) {
    setSelectedAllergy(allergy);
    setAllergyDetailsOpen(true);
  }

  function closeAllergyDetails() {
    setAllergyDetailsOpen(false);
    setSelectedAllergy(null);
  }

    // Insurance state
  const [insurance, setInsurance] = useState<ClientInsurance[]>([]);
  const [insuranceError, setInsuranceError] = useState<string | null>(null);
  const [insuranceLoading, setInsuranceLoading] = useState(true);

  const [newInsuranceType, setNewInsuranceType] = useState("");
  const [newInsuranceCarrier, setNewInsuranceCarrier] = useState("");
  const [newInsurancePolicyNumber, setNewInsurancePolicyNumber] = useState("");
  const [newInsuranceGroupNumber, setNewInsuranceGroupNumber] = useState("");
  const [newInsuranceMemberId, setNewInsuranceMemberId] = useState("");
  const [newInsurancePhone, setNewInsurancePhone] = useState("");
  const [newInsuranceNotes, setNewInsuranceNotes] = useState("");
  const [newInsurancePrimary, setNewInsurancePrimary] = useState(false);
  const [savingInsurance, setSavingInsurance] = useState(false);
  const [insuranceMessage, setInsuranceMessage] = useState<string | null>(null);

  const [insuranceDetailsOpen, setInsuranceDetailsOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] =
    useState<ClientInsurance | null>(null);

  function openInsuranceDetails(record: ClientInsurance) {
    setSelectedInsurance(record);
    setInsuranceDetailsOpen(true);
  }

  function closeInsuranceDetails() {
    setInsuranceDetailsOpen(false);
    setSelectedInsurance(null);
  }

    // Risks state
  const [risks, setRisks] = useState<ClientRisk[]>([]);
  const [risksError, setRisksError] = useState<string | null>(null);
  const [risksLoading, setRisksLoading] = useState(true);

  const [newRiskCategory, setNewRiskCategory] = useState("");
  const [newRiskSeverity, setNewRiskSeverity] = useState("");
  const [newRiskNotes, setNewRiskNotes] = useState("");
  const [savingRisk, setSavingRisk] = useState(false);
  const [riskMessage, setRiskMessage] = useState<string | null>(null);

  const [riskDetailsOpen, setRiskDetailsOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<ClientRisk | null>(null);

  function openRiskDetails(risk: ClientRisk) {
    setSelectedRisk(risk);
    setRiskDetailsOpen(true);
  }

  function closeRiskDetails() {
    setRiskDetailsOpen(false);
    setSelectedRisk(null);
  }

      // Documents state
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("");
  const [newDocFileType, setNewDocFileType] = useState("");
  const [savingDocument, setSavingDocument] = useState(false);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);

  const [documentDetailsOpen, setDocumentDetailsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<ClientDocument | null>(null);

  function openDocumentDetails(doc: ClientDocument) {
    setSelectedDocument(doc);
    setDocumentDetailsOpen(true);
  }

  function closeDocumentDetails() {
    setDocumentDetailsOpen(false);
    setSelectedDocument(null);
  }

    // Care Plans state
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [carePlansLoading, setCarePlansLoading] = useState(true);
  const [carePlansError, setCarePlansError] = useState<string | null>(null);

  const [newCarePlanTitle, setNewCarePlanTitle] = useState("");
  const [newCarePlanStatus, setNewCarePlanStatus] = useState("active");
  const [newCarePlanTargetDate, setNewCarePlanTargetDate] = useState("");
  const [newCarePlanSummary, setNewCarePlanSummary] = useState("");
  const [savingCarePlan, setSavingCarePlan] = useState(false);
  const [carePlanMessage, setCarePlanMessage] = useState<string | null>(null);

  const [carePlanDetailsOpen, setCarePlanDetailsOpen] = useState(false);
  const [selectedCarePlan, setSelectedCarePlan] = useState<CarePlan | null>(
    null
  );


    // Goals for selected care plan (only loaded when viewing a plan)
  const [carePlanGoals, setCarePlanGoals] = useState<CarePlanGoal[]>([]);
  const [carePlanGoalsLoading, setCarePlanGoalsLoading] = useState(false);
  const [carePlanGoalsError, setCarePlanGoalsError] = useState<string | null>(
    null
  );

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalStatus, setNewGoalStatus] = useState("active");
  const [newGoalPriority, setNewGoalPriority] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalMessage, setGoalMessage] = useState<string | null>(null);

    // Progress Notes state
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([]);
  const [progressNotesLoading, setProgressNotesLoading] = useState(true);
  const [progressNotesError, setProgressNotesError] = useState<string | null>(
    null
  );

  const [newProgDate, setNewProgDate] = useState("");
  const [newProgType, setNewProgType] = useState("");
  const [newProgContent, setNewProgContent] = useState("");
  const [newProgCarePlanId, setNewProgCarePlanId] = useState("");
  const [savingProgressNote, setSavingProgressNote] = useState(false);
  const [progressNoteMessage, setProgressNoteMessage] = useState<
    string | null
  >(null);

  const [faceSheetLoading, setFaceSheetLoading] = useState(false);


  const [progressNoteDetailsOpen, setProgressNoteDetailsOpen] =
    useState(false);
  const [selectedProgressNote, setSelectedProgressNote] =
    useState<ProgressNote | null>(null);
    


  // Helper: initials for avatars
  function initials(name: string | undefined | null) {
    if (!name) return "CM";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }

    // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(true);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);

  const [auditLogDetailsOpen, setAuditLogDetailsOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] =
    useState<AuditLogEntry | null>(null);

      function openAuditLogDetails(entry: AuditLogEntry) {
    setSelectedAuditLog(entry);
    setAuditLogDetailsOpen(true);
  }

  function closeAuditLogDetails() {
    setAuditLogDetailsOpen(false);
    setSelectedAuditLog(null);
  }


  // Role check
  useEffect(() => {
    const userJson = sessionStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setIsAdmin(user.role === "admin");
        setIsCareManager(user.role === "care_manager");
      } catch {
        setIsAdmin(false);
        setIsCareManager(false);
      }
    }
  }, []);

  // 1) Fetch client
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchClient() {
      try {
        setClientLoading(true);
        setClientError("");

        const res = await fetch(`${API_BASE_URL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          setClientError(data.error || "Failed to load client.");
          setClientLoading(false);
          return;
        }

        const found = (data as any[]).find((c) => c.id === clientId);

        if (!found) {
          setClientError("Client not found.");
        } else {
          setClient(found as Client);
        }
      } catch (err) {
        console.error(err);
        setClientError("Could not load client details.");
      } finally {
        setClientLoading(false);
      }
    }

    fetchClient();
  }, [clientId, router]);

  // 2) Fetch activities
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchActivities() {
      try {
        setActivitiesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/activities?clientId=${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching activities:", data.error || data);
          setActivitiesError(data.error || "Failed to load activities.");
          return;
        }

        const mapped: ActivityApi[] = (data as any[]).map((a) => ({
          id: a.id,
          startTime: a.startTime,
          endTime: a.endTime,
          duration: a.duration,
          notes: a.notes,
          serviceType: a.serviceType,
          isBillable: a.isBillable,
        }));

        setActivities(mapped);

        const recent = [...mapped]
          .sort((a, b) => (a.startTime < b.startTime ? 1 : -1))
          .slice(0, 10);
        setRecentActivities(recent);
      } catch (err) {
        console.error(err);
        setActivitiesError("Could not load activities.");
      }
    }

    fetchActivities();
  }, [clientId]);

  // 3) Fetch invoices
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchInvoices() {
      try {
        setInvoicesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/invoices?clientId=${clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching invoices:", data.error || data);
          setInvoicesError(data.error || "Failed to load invoices.");
          return;
        }

        setInvoices(
          (data as any[]).map((inv) => ({
            id: inv.id,
            totalAmount: inv.totalAmount,
            status: inv.status,
            periodEnd: inv.periodEnd,
          }))
        );
      } catch (err) {
        console.error(err);
        setInvoicesError("Could not load invoices.");
      }
    }

    fetchInvoices();
  }, [clientId]);

  // 4) Fetch notes
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchNotes() {
      try {
        setNotesLoading(true);
        setNotesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/notes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Error fetching notes:", data.error || data);
          setNotesError(data.error || "Failed to load notes.");
          setNotesLoading(false);
          return;
        }

        setNotes(
          (data as any[]).map((n) => ({
            id: n.id,
            content: n.content,
            createdAt: n.createdAt,
            authorId: n.authorId,
            authorName: n.authorName ?? null,
          }))
        );

        setNotesLoading(false);
      } catch (err) {
        console.error(err);
        setNotesError("Could not load notes.");
        setNotesLoading(false);
      }
    }

    fetchNotes();
  }, [clientId]);

  // 4.5) Fetch contacts
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchContacts() {
      try {
        setContactsLoading(true);
        setContactsError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/contacts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching contacts:", data);
          setContactsError(
            (data as any).error ||
              "Failed to load contacts. You may not have permission."
          );
          setContactsLoading(false);
          return;
        }

        setContacts(
          (data as any[]).map((c) => ({
            id: c.id,
            name: c.name,
            relationship: c.relationship ?? null,
            phone: c.phone ?? null,
            email: c.email ?? null,
            address: c.address ?? null,
            notes: c.notes ?? null,
            isEmergencyContact: Boolean(c.isEmergencyContact),
            createdAt: c.createdAt,
          }))
        );
        setContactsLoading(false);
      } catch (err) {
        console.error(err);
        setContactsError("Could not load contacts.");
        setContactsLoading(false);
      }
    }

    fetchContacts();
  }, [clientId]);

  // 4.6) Fetch providers (care team)
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchProviders() {
      try {
        setProvidersLoading(true);
        setProvidersError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/providers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const text = await res.text().catch(() => "");
        let data: any;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = text || {};
        }

        if (!res.ok) {
          console.error("Error fetching providers:", {
            status: res.status,
            body: data,
          });
          setProvidersError(
            (data as any).error ||
              "Failed to load providers. You may not have permission."
          );
          setProvidersLoading(false);
          return;
        }

        setProviders(
          (data as any[]).map((p) => ({
            id: p.id,
            type: p.type,
            name: p.name,
            specialty: p.specialty ?? null,
            phone: p.phone ?? null,
            email: p.email ?? null,
            address: p.address ?? null,
            notes: p.notes ?? null,
            createdAt: p.createdAt,
          }))
        );
        setProvidersLoading(false);
      } catch (err) {
        console.error(err);
        setProvidersError("Could not load providers.");
        setProvidersLoading(false);
      }
    }

    fetchProviders();
  }, [clientId]);

  // 4.7) Fetch medications
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchMedications() {
      try {
        setMedicationsLoading(true);
        setMedicationsError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/medications`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching medications:", data);
          setMedicationsError(
            (data as any).error ||
              "Failed to load medications. You may not have permission."
          );
          setMedicationsLoading(false);
          return;
        }

        setMedications(
          (data as any[]).map((m) => ({
            id: m.id,
            name: m.name,
            dosage: m.dosage ?? null,
            frequency: m.frequency ?? null,
            route: m.route ?? null,
            prescribingProvider: m.prescribingProvider ?? null,
            notes: m.notes ?? null,
            createdAt: m.createdAt,
          }))
        );
        setMedicationsLoading(false);
      } catch (err) {
        console.error(err);
        setMedicationsError("Could not load medications.");
        setMedicationsLoading(false);
      }
    }

    fetchMedications();
  }, [clientId]);

    // 4.8) Fetch allergies
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchAllergies() {
      try {
        setAllergiesLoading(true);
        setAllergiesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/allergies`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching allergies:", data);
          setAllergiesError(
            (data as any).error ||
              "Failed to load allergies. You may not have permission."
          );
          setAllergiesLoading(false);
          return;
        }

        setAllergies(
          (data as any[]).map((a) => ({
            id: a.id,
            allergen: a.allergen,
            reaction: a.reaction ?? null,
            severity: a.severity ?? null,
            notes: a.notes ?? null,
            createdAt: a.createdAt,
          }))
        );
        setAllergiesLoading(false);
      } catch (err) {
        console.error(err);
        setAllergiesError("Could not load allergies.");
        setAllergiesLoading(false);
      }
    }

    fetchAllergies();
  }, [clientId]);

    // 4.9) Fetch insurance
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchInsurance() {
      try {
        setInsuranceLoading(true);
        setInsuranceError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/insurance`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching insurance:", data);
          setInsuranceError(
            (data as any).error ||
              "Failed to load insurance. You may not have permission."
          );
          setInsuranceLoading(false);
          return;
        }

        setInsurance(
          (data as any[]).map((r) => ({
            id: r.id,
            insuranceType: r.insuranceType ?? null,
            carrier: r.carrier ?? null,
            policyNumber: r.policyNumber ?? null,
            groupNumber: r.groupNumber ?? null,
            memberId: r.memberId ?? null,
            phone: r.phone ?? null,
            notes: r.notes ?? null,
            primary: Boolean(r.primary),
            createdAt: r.createdAt,
          }))
        );
        setInsuranceLoading(false);
      } catch (err) {
        console.error(err);
        setInsuranceError("Could not load insurance.");
        setInsuranceLoading(false);
      }
    }

    fetchInsurance();
  }, [clientId]);


    // 4.10) Fetch risks
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchRisks() {
      try {
        setRisksLoading(true);
        setRisksError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/risks`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching risks:", data);
          setRisksError(
            (data as any).error ||
              "Failed to load risks. You may not have permission."
          );
          setRisksLoading(false);
          return;
        }

        setRisks(
          (data as any[]).map((r) => ({
            id: r.id,
            category: r.category,
            severity: r.severity ?? null,
            notes: r.notes ?? null,
            createdAt: r.createdAt,
          }))
        );
        setRisksLoading(false);
      } catch (err) {
        console.error(err);
        setRisksError("Could not load risks.");
        setRisksLoading(false);
      }
    }

    fetchRisks();
  }, [clientId]);

    // 4.11) Fetch documents
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchDocuments() {
      try {
        setDocumentsLoading(true);
        setDocumentsError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/documents`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching documents:", data);
          setDocumentsError(
            (data as any).error ||
              "Failed to load documents. You may not have permission."
          );
          setDocumentsLoading(false);
          return;
        }

        setDocuments(
          (data as any[]).map((d) => ({
            id: d.id,
            title: d.title,
            fileUrl: d.fileUrl,
            fileType: d.fileType ?? null,
            category: d.category ?? null,
            uploadedAt: d.uploadedAt,
            createdAt: d.createdAt,
          }))
        );
        setDocumentsLoading(false);
      } catch (err) {
        console.error(err);
        setDocumentsError("Could not load documents.");
        setDocumentsLoading(false);
      }
    }

    fetchDocuments();
  }, [clientId]);

    // Fetch care plans
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchCarePlans() {
      try {
        setCarePlansLoading(true);
        setCarePlansError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/care-plans`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching care plans:", data);
          setCarePlansError(
            (data as any).error || "Failed to load care plans."
          );
          setCarePlansLoading(false);
          return;
        }

        setCarePlans(
          (data as any[]).map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            startDate: p.startDate ?? null,
            targetDate: p.targetDate ?? null,
            summary: p.summary ?? null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }))
        );
        setCarePlansLoading(false);
      } catch (err) {
        console.error(err);
        setCarePlansError("Could not load care plans.");
        setCarePlansLoading(false);
      }
    }

    fetchCarePlans();
  }, [clientId]);

    // Fetch progress notes
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchProgressNotes() {
      try {
        setProgressNotesLoading(true);
        setProgressNotesError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/progress-notes`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching progress notes:", data);
          setProgressNotesError(
            (data as any).error || "Failed to load progress notes."
          );
          setProgressNotesLoading(false);
          return;
        }

        setProgressNotes(
          (data as any[]).map((n) => ({
            id: n.id,
            date: n.date,
            noteType: n.noteType ?? null,
            content: n.content,
            authorId: n.authorId,
            authorName: n.author?.name ?? null,
            carePlanId: n.carePlanId ?? null,
            carePlanTitle: n.carePlan?.title ?? null,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
          }))
        );
        setProgressNotesLoading(false);
      } catch (err) {
        console.error(err);
        setProgressNotesError("Could not load progress notes.");
        setProgressNotesLoading(false);
      }
    }

    fetchProgressNotes();
  }, [clientId]);

    // Fetch audit logs (medications & risks)
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    async function fetchAuditLogs() {
      try {
        setAuditLogsLoading(true);
        setAuditLogsError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/audit-logs`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Error fetching audit logs:", data);
          setAuditLogsError(
            (data as any).error || "Failed to load audit trail."
          );
          setAuditLogsLoading(false);
          return;
        }

        setAuditLogs(
          (data as any[]).map((log) => ({
            id: log.id,
            entityType: log.entityType,
            entityId: log.entityId ?? null,
            action: log.action,
            details: log.details ?? null,
            createdAt: log.createdAt,
            userName: log.userName ?? null,
          }))
        );
        setAuditLogsLoading(false);
      } catch (err) {
        console.error(err);
        setAuditLogsError("Could not load audit trail.");
        setAuditLogsLoading(false);
      }
    }

    fetchAuditLogs();
  }, [clientId]);





  // 5) Compute summary
  const clientSummary = useMemo(() => {
    if (!client) {
      return {
        totalHours: 0,
        openInvoicesCount: 0,
        lastActivityDate: null as string | null,
      };
    }

    const totalHours = activities.reduce(
      (sum, entry) => sum + (entry.duration || 0) / 60,
      0
    );

    const openInvoicesCount = invoices.filter(
      (inv) => inv.status === "sent" || inv.status === "overdue"
    ).length;

    let lastActivityDate: string | null = null;
    if (activities.length > 0) {
      lastActivityDate = activities
        .map((a) => a.startTime.slice(0, 10))
        .sort()
        .slice(-1)[0];
    }

    return {
      totalHours,
      openInvoicesCount,
      lastActivityDate,
    };
  }, [client, activities, invoices]);

    const clientSnapshot = useMemo(() => {
    if (!client) {
      return {
        primaryContactName: null as string | null,
        primaryContactPhone: null as string | null,
        primaryContactEmail: null as string | null,
        medCount: 0,
        medExamples: [] as string[],
        allergyCount: 0,
        topAllergyLabel: null as string | null,
        riskCount: 0,
        topRiskLabel: null as string | null,
        primaryInsuranceLabel: null as string | null,
      };
    }

    // pick an emergency contact first, else first contact, else billing contact
    const emergency = contacts.find((c) => c.isEmergencyContact);
    const firstContact = contacts[0];
    const billingName = client.billingContactName || null;
    const billingPhone = client.billingContactName || null;
    const billingEmail = client.billingContactEmail || null;

    const primaryContact = emergency || firstContact || null;

    const primaryContactName =
      primaryContact?.name || billingName;
    const primaryContactPhone =
      primaryContact?.phone || billingPhone;
    const primaryContactEmail =
      primaryContact?.email || billingEmail;

    // meds
    const medCount = medications.length;
    const medExamples = medications
      .map((m) => m.name)
      .filter(Boolean)
      .slice(0, 2);

    // allergies – prefer "severe", else first one
    const allergyCount = allergies.length;
    const severeAllergy =
      allergies.find(
        (a) =>
          (a.severity ?? "").toLowerCase() === "severe"
      ) || allergies[0] || null;

    const topAllergyLabel = severeAllergy
      ? `${severeAllergy.allergen}${
          severeAllergy.severity
            ? ` (${severeAllergy.severity})`
            : ""
        }`
      : null;

    // risks – prefer "high", else first
    const riskCount = risks.length;
    const highRisk =
      risks.find(
        (r) =>
          (r.severity ?? "").toLowerCase() === "high"
      ) || risks[0] || null;

    const topRiskLabel = highRisk
      ? `${highRisk.category}${
          highRisk.severity ? ` (${highRisk.severity})` : ""
        }`
      : null;

    // insurance – primary or first
    const primaryInsurance =
      insurance.find((i) => i.primary) || insurance[0] || null;

    const primaryInsuranceLabel = primaryInsurance
      ? [
          primaryInsurance.carrier,
          primaryInsurance.insuranceType,
          primaryInsurance.policyNumber,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

    return {
      primaryContactName,
      primaryContactPhone,
      primaryContactEmail,
      medCount,
      medExamples,
      allergyCount,
      topAllergyLabel,
      riskCount,
      topRiskLabel,
      primaryInsuranceLabel,
    };
  }, [client, contacts, medications, allergies, risks, insurance]);


  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteMessage(null);

    const content = newNote.trim();
    if (!content) {
      setNoteMessage("Please enter some text for the note.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setNoteMessage("You are not logged in. Please log in again.");
      return;
    }

    setSavingNote(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setNoteMessage(data.error || "Failed to create note.");
        setSavingNote(false);
        return;
      }

      const newCreated: Note = {
        id: data.id,
        content: data.content,
        createdAt: data.createdAt,
        authorId: data.authorId,
        authorName: data.authorName ?? null,
      };

      setNotes((prev) => [newCreated, ...prev]);
      setNewNote("");
      setNoteMessage("Note added.");
      setSavingNote(false);
    } catch (err) {
      console.error(err);
      setNoteMessage("Something went wrong while creating the note.");
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!window.confirm("Delete this note? This cannot be undone.")) {
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setNoteMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Error deleting note:", data);
        setNoteMessage(
          (data as any).error ||
            "Failed to delete note. You may not have permission."
        );
        return;
      }

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setNoteMessage("Note deleted.");
    } catch (err) {
      console.error(err);
      setNoteMessage("Something went wrong while deleting the note.");
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setContactMessage(null);

    const name = newContactName.trim();
    if (!name) {
      setContactMessage("Please enter a name for the contact.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setContactMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingContact(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            relationship: newContactRelationship || undefined,
            phone: newContactPhone || undefined,
            email: newContactEmail || undefined,
            address: newContactAddress || undefined,
            notes: newContactNotes || undefined,
            isEmergencyContact: newContactIsEmergency,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating contact:", data);
        setContactMessage(
          (data as any).error || "Failed to create contact."
        );
        setSavingContact(false);
        return;
      }

      const created: ClientContact = {
        id: data.id,
        name: data.name,
        relationship: data.relationship ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        isEmergencyContact: Boolean(data.isEmergencyContact),
        createdAt: data.createdAt,
      };

      setContacts((prev) => [created, ...prev]);
      setNewContactName("");
      setNewContactRelationship("");
      setNewContactPhone("");
      setNewContactEmail("");
      setNewContactAddress("");
      setNewContactNotes("");
      setNewContactIsEmergency(false);
      setContactMessage("Contact added.");
      setSavingContact(false);
    } catch (err) {
      console.error(err);
      setContactMessage("Unexpected error while creating contact.");
      setSavingContact(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    setContactMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setContactMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting contact:", data);
        setContactMessage(
          (data as any).error ||
            "Failed to delete contact. You may not have permission."
        );
        return;
      }

      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setContactMessage("Contact deleted.");
    } catch (err) {
      console.error(err);
      setContactMessage("Unexpected error while deleting contact.");
    }
  }

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault();
    setProviderMessage(null);

    const type = newProviderType.trim();
    const name = newProviderName.trim();

    if (!type || !name) {
      setProviderMessage("Please enter provider type and name.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setProviderMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingProvider(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/providers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            name,
            specialty: newProviderSpecialty || undefined,
            phone: newProviderPhone || undefined,
            email: newProviderEmail || undefined,
            address: newProviderAddress || undefined,
            notes: newProviderNotes || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating provider:", data);
        setProviderMessage(
          (data as any).error || "Failed to create provider."
        );
        setSavingProvider(false);
        return;
      }

      const created: ClientProvider = {
        id: data.id,
        type: data.type,
        name: data.name,
        specialty: data.specialty ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
      };

      setProviders((prev) => [created, ...prev]);
      setNewProviderType("");
      setNewProviderName("");
      setNewProviderSpecialty("");
      setNewProviderPhone("");
      setNewProviderEmail("");
      setNewProviderAddress("");
      setNewProviderNotes("");
      setProviderMessage("Provider added.");
      setSavingProvider(false);
    } catch (err) {
      console.error(err);
      setProviderMessage("Unexpected error while creating provider.");
      setSavingProvider(false);
    }
  }

    async function handleAddCarePlan(e: React.FormEvent) {
    e.preventDefault();
    setCarePlanMessage(null);

    const title = newCarePlanTitle.trim();
    if (!title) {
      setCarePlanMessage("Please enter a care plan title.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setCarePlanMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingCarePlan(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/care-plans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            status: newCarePlanStatus || "active",
            targetDate: newCarePlanTargetDate || undefined,
            summary: newCarePlanSummary || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating care plan:", data);
        setCarePlanMessage(
          (data as any).error || "Failed to create care plan."
        );
        setSavingCarePlan(false);
        return;
      }

      const created: CarePlan = {
        id: data.id,
        title: data.title,
        status: data.status,
        startDate: data.startDate ?? null,
        targetDate: data.targetDate ?? null,
        summary: data.summary ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setCarePlans((prev) => [created, ...prev]);
      setNewCarePlanTitle("");
      setNewCarePlanStatus("active");
      setNewCarePlanTargetDate("");
      setNewCarePlanSummary("");
      setCarePlanMessage("Care plan added.");
      setSavingCarePlan(false);
    } catch (err) {
      console.error(err);
      setCarePlanMessage("Unexpected error while creating care plan.");
      setSavingCarePlan(false);
    }
  }

    async function handleDeleteCarePlan(carePlanId: string) {
    setCarePlanMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setCarePlanMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/care-plans/${carePlanId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting care plan:", data);
        setCarePlanMessage(
          (data as any).error ||
            "Failed to delete care plan. You may not have permission."
        );
        return;
      }

      setCarePlans((prev) => prev.filter((p) => p.id !== carePlanId));
      setCarePlanMessage("Care plan deleted.");
    } catch (err) {
      console.error(err);
      setCarePlanMessage("Unexpected error while deleting care plan.");
    }
  }

    async function openCarePlanDetails(plan: CarePlan) {
    setSelectedCarePlan(plan);
    setCarePlanDetailsOpen(true);

    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      setCarePlanGoalsLoading(true);
      setCarePlanGoalsError(null);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/care-plans/${plan.id}/goals`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error fetching goals:", data);
        setCarePlanGoalsError(
          (data as any).error || "Failed to load goals."
        );
        setCarePlanGoalsLoading(false);
        return;
      }

      setCarePlanGoals(
        (data as any[]).map((g) => ({
          id: g.id,
          carePlanId: g.carePlanId,
          title: g.title,
          description: g.description ?? null,
          status: g.status,
          priority: g.priority ?? null,
          targetDate: g.targetDate ?? null,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        }))
      );
      setCarePlanGoalsLoading(false);
    } catch (err) {
      console.error(err);
      setCarePlanGoalsError("Could not load goals.");
      setCarePlanGoalsLoading(false);
    }
  }

  function closeCarePlanDetails() {
    setCarePlanDetailsOpen(false);
    setSelectedCarePlan(null);
    setCarePlanGoals([]);
    setGoalMessage(null);
  }


    async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    setGoalMessage(null);

    if (!selectedCarePlan) {
      setGoalMessage("No care plan selected.");
      return;
    }

    const title = newGoalTitle.trim();
    if (!title) {
      setGoalMessage("Please enter a goal title.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setGoalMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingGoal(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/care-plans/${selectedCarePlan.id}/goals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description: newGoalDescription || undefined,
            status: newGoalStatus || "active",
            priority: newGoalPriority || undefined,
            targetDate: newGoalTargetDate || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating goal:", data);
        setGoalMessage((data as any).error || "Failed to create goal.");
        setSavingGoal(false);
        return;
      }

      const created: CarePlanGoal = {
        id: data.id,
        carePlanId: data.carePlanId,
        title: data.title,
        description: data.description ?? null,
        status: data.status,
        priority: data.priority ?? null,
        targetDate: data.targetDate ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setCarePlanGoals((prev) => [created, ...prev]);
      setNewGoalTitle("");
      setNewGoalDescription("");
      setNewGoalStatus("active");
      setNewGoalPriority("");
      setNewGoalTargetDate("");
      setGoalMessage("Goal added.");
      setSavingGoal(false);
    } catch (err) {
      console.error(err);
      setGoalMessage("Unexpected error while creating goal.");
      setSavingGoal(false);
    }
  }

    async function handleAddProgressNote(e: React.FormEvent) {
    e.preventDefault();
    setProgressNoteMessage(null);

    const content = newProgContent.trim();
    if (!content) {
      setProgressNoteMessage("Please enter note content.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setProgressNoteMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingProgressNote(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/progress-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: newProgDate || undefined,
            noteType: newProgType || undefined,
            content,
            carePlanId: newProgCarePlanId || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating progress note:", data);
        setProgressNoteMessage(
          (data as any).error || "Failed to create progress note."
        );
        setSavingProgressNote(false);
        return;
      }

      const created: ProgressNote = {
        id: data.id,
        date: data.date,
        noteType: data.noteType ?? null,
        content: data.content,
        authorId: data.authorId,
        authorName: data.author?.name ?? null,
        carePlanId: data.carePlanId ?? null,
        carePlanTitle: data.carePlan?.title ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setProgressNotes((prev) => [created, ...prev]);
      setNewProgDate("");
      setNewProgType("");
      setNewProgContent("");
      setNewProgCarePlanId("");
      setProgressNoteMessage("Progress note added.");
      setSavingProgressNote(false);
    } catch (err) {
      console.error(err);
      setProgressNoteMessage("Unexpected error while creating progress note.");
      setSavingProgressNote(false);
    }
  }

    async function handleDeleteProgressNote(noteId: string) {
    setProgressNoteMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setProgressNoteMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/progress-notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting progress note:", data);
        setProgressNoteMessage(
          (data as any).error ||
            "Failed to delete progress note. You may not have permission."
        );
        return;
      }

      setProgressNotes((prev) => prev.filter((n) => n.id !== noteId));
      setProgressNoteMessage("Progress note deleted.");
    } catch (err) {
      console.error(err);
      setProgressNoteMessage("Unexpected error while deleting progress note.");
    }
  }

  function openProgressNoteDetails(note: ProgressNote) {
    setSelectedProgressNote(note);
    setProgressNoteDetailsOpen(true);
  }

  function closeProgressNoteDetails() {
    setProgressNoteDetailsOpen(false);
    setSelectedProgressNote(null);
  }



  async function handleDeleteProvider(providerId: string) {
    setProviderMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setProviderMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/providers/${providerId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting provider:", data);
        setProviderMessage(
          (data as any).error ||
            "Failed to delete provider. You may not have permission."
        );
        return;
      }

      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      setProviderMessage("Provider deleted.");
    } catch (err) {
      console.error(err);
      setProviderMessage("Unexpected error while deleting provider.");
    }
  }

  async function handleAddMedication(e: React.FormEvent) {
    e.preventDefault();
    setMedicationMessage(null);

    const name = newMedName.trim();
    if (!name) {
      setMedicationMessage("Please enter a medication name.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setMedicationMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingMedication(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            dosage: newMedDosage || undefined,
            frequency: newMedFrequency || undefined,
            route: newMedRoute || undefined,
            prescribingProvider:
              newMedPrescribingProvider || undefined,
            notes: newMedNotes || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating medication:", data);
        setMedicationMessage(
          (data as any).error || "Failed to create medication."
        );
        setSavingMedication(false);
        return;
      }

      const created: ClientMedication = {
        id: data.id,
        name: data.name,
        dosage: data.dosage ?? null,
        frequency: data.frequency ?? null,
        route: data.route ?? null,
        prescribingProvider: data.prescribingProvider ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
      };

      setMedications((prev) => [created, ...prev]);
      setNewMedName("");
      setNewMedDosage("");
      setNewMedFrequency("");
      setNewMedRoute("");
      setNewMedPrescribingProvider("");
      setNewMedNotes("");
      setMedicationMessage("Medication added.");
      setSavingMedication(false);
    } catch (err) {
      console.error(err);
      setMedicationMessage("Unexpected error while creating medication.");
      setSavingMedication(false);
    }
  }

    async function handleAddAllergy(e: React.FormEvent) {
    e.preventDefault();
    setAllergyMessage(null);

    const allergen = newAllergen.trim();
    if (!allergen) {
      setAllergyMessage("Please enter an allergen.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setAllergyMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingAllergy(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/allergies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            allergen,
            reaction: newAllergyReaction || undefined,
            severity: newAllergySeverity || undefined,
            notes: newAllergyNotes || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating allergy:", data);
        setAllergyMessage(
          (data as any).error || "Failed to create allergy."
        );
        setSavingAllergy(false);
        return;
      }

      const created: ClientAllergy = {
        id: data.id,
        allergen: data.allergen,
        reaction: data.reaction ?? null,
        severity: data.severity ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
      };

      setAllergies((prev) => [created, ...prev]);
      setNewAllergen("");
      setNewAllergyReaction("");
      setNewAllergySeverity("");
      setNewAllergyNotes("");
      setAllergyMessage("Allergy added.");
      setSavingAllergy(false);
    } catch (err) {
      console.error(err);
      setAllergyMessage("Unexpected error while creating allergy.");
      setSavingAllergy(false);
    }
  }


  async function handleDeleteAllergy(allergyId: string) {
    setAllergyMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setAllergyMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/allergies/${allergyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting allergy:", data);
        setAllergyMessage(
          (data as any).error ||
            "Failed to delete allergy. You may not have permission."
        );
        return;
      }

      setAllergies((prev) => prev.filter((a) => a.id !== allergyId));
      setAllergyMessage("Allergy deleted.");
    } catch (err) {
      console.error(err);
      setAllergyMessage("Unexpected error while deleting allergy.");
    }
  }

    async function handleAddInsurance(e: React.FormEvent) {
    e.preventDefault();
    setInsuranceMessage(null);

    const hasCarrier = newInsuranceCarrier.trim().length > 0;
    const hasType = newInsuranceType.trim().length > 0;

    if (!hasCarrier && !hasType) {
      setInsuranceMessage("Please enter at least carrier or insurance type.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setInsuranceMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingInsurance(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/insurance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            insuranceType: newInsuranceType || undefined,
            carrier: newInsuranceCarrier || undefined,
            policyNumber: newInsurancePolicyNumber || undefined,
            groupNumber: newInsuranceGroupNumber || undefined,
            memberId: newInsuranceMemberId || undefined,
            phone: newInsurancePhone || undefined,
            notes: newInsuranceNotes || undefined,
            primary: newInsurancePrimary,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating insurance:", data);
        setInsuranceMessage(
          (data as any).error || "Failed to create insurance."
        );
        setSavingInsurance(false);
        return;
      }

      const created: ClientInsurance = {
        id: data.id,
        insuranceType: data.insuranceType ?? null,
        carrier: data.carrier ?? null,
        policyNumber: data.policyNumber ?? null,
        groupNumber: data.groupNumber ?? null,
        memberId: data.memberId ?? null,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
        primary: Boolean(data.primary),
        createdAt: data.createdAt,
      };

      setInsurance((prev) => [created, ...prev]);
      setNewInsuranceType("");
      setNewInsuranceCarrier("");
      setNewInsurancePolicyNumber("");
      setNewInsuranceGroupNumber("");
      setNewInsuranceMemberId("");
      setNewInsurancePhone("");
      setNewInsuranceNotes("");
      setNewInsurancePrimary(false);
      setInsuranceMessage("Insurance record added.");
      setSavingInsurance(false);
    } catch (err) {
      console.error(err);
      setInsuranceMessage("Unexpected error while creating insurance.");
      setSavingInsurance(false);
    }
  }

  async function handleDeleteInsurance(insuranceId: string) {
    setInsuranceMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setInsuranceMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/insurance/${insuranceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting insurance:", data);
        setInsuranceMessage(
          (data as any).error ||
            "Failed to delete insurance. You may not have permission."
        );
        return;
      }

      setInsurance((prev) => prev.filter((r) => r.id !== insuranceId));
      setInsuranceMessage("Insurance record deleted.");
    } catch (err) {
      console.error(err);
      setInsuranceMessage("Unexpected error while deleting insurance.");
    }
  }

    async function handleAddRisk(e: React.FormEvent) {
    e.preventDefault();
    setRiskMessage(null);

    const category = newRiskCategory.trim();
    if (!category) {
      setRiskMessage("Please enter a risk category.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setRiskMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingRisk(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/risks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category,
            severity: newRiskSeverity || undefined,
            notes: newRiskNotes || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating risk:", data);
        setRiskMessage((data as any).error || "Failed to create risk.");
        setSavingRisk(false);
        return;
      }

      const created: ClientRisk = {
        id: data.id,
        category: data.category,
        severity: data.severity ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
      };

      setRisks((prev) => [created, ...prev]);
      setNewRiskCategory("");
      setNewRiskSeverity("");
      setNewRiskNotes("");
      setRiskMessage("Risk added.");
      setSavingRisk(false);
    } catch (err) {
      console.error(err);
      setRiskMessage("Unexpected error while creating risk.");
      setSavingRisk(false);
    }
  }

  async function handleDeleteRisk(riskId: string) {
    setRiskMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setRiskMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/risks/${riskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting risk:", data);
        setRiskMessage(
          (data as any).error ||
            "Failed to delete risk. You may not have permission."
        );
        return;
      }

      setRisks((prev) => prev.filter((r) => r.id !== riskId));
      setRiskMessage("Risk deleted.");
    } catch (err) {
      console.error(err);
      setRiskMessage("Unexpected error while deleting risk.");
    }
  }

      async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    setDocumentMessage(null);

    const title = newDocTitle.trim();
    const url = newDocUrl.trim();

    if (!title || !url) {
      setDocumentMessage("Please enter a title and a document URL.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      setDocumentMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      setSavingDocument(true);

      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            fileUrl: url,
            category: newDocCategory || undefined,
            fileType: newDocFileType || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Error creating document:", data);
        setDocumentMessage(
          (data as any).error || "Failed to create document."
        );
        setSavingDocument(false);
        return;
      }

      const created: ClientDocument = {
        id: data.id,
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType ?? null,
        category: data.category ?? null,
        uploadedAt: data.uploadedAt,
        createdAt: data.createdAt,
      };

      setDocuments((prev) => [created, ...prev]);
      setNewDocTitle("");
      setNewDocUrl("");
      setNewDocCategory("");
      setNewDocFileType("");
      setDocumentMessage("Document added.");
      setSavingDocument(false);
    } catch (err) {
      console.error(err);
      setDocumentMessage("Unexpected error while creating document.");
      setSavingDocument(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setDocumentMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setDocumentMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/documents/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting document:", data);
        setDocumentMessage(
          (data as any).error ||
            "Failed to delete document. You may not have permission."
        );
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      setDocumentMessage("Document deleted.");
    } catch (err) {
      console.error(err);
      setDocumentMessage("Unexpected error while deleting document.");
    }
  }



  async function handleDeleteMedication(medId: string) {
    setMedicationMessage(null);

    const token = sessionStorage.getItem("token");
    if (!token) {
      setMedicationMessage("You are not logged in. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medications/${medId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Error deleting medication:", data);
        setMedicationMessage(
          (data as any).error ||
            "Failed to delete medication. You may not have permission."
        );
        return;
      }

      setMedications((prev) => prev.filter((m) => m.id !== medId));
      setMedicationMessage("Medication deleted.");
    } catch (err) {
      console.error(err);
      setMedicationMessage("Unexpected error while deleting medication.");
    }
  }

    async function handleExportFaceSheet() {
    setFaceSheetLoading(true);

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      setFaceSheetLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/face-sheet`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Error downloading face sheet:", text);
        alert("Failed to generate face sheet PDF.");
        setFaceSheetLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const safeName = client?.name?.replace(/[^a-z0-9_\- ]/gi, "_") || "client";
      link.download = `${safeName}_face_sheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFaceSheetLoading(false);
    } catch (err) {
      console.error(err);
      alert("Unexpected error while generating face sheet.");
      setFaceSheetLoading(false);
    }
  }


  return (
    <ProtectedLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          ← Back to Clients
        </button>

        {/* Loading / error */}
        {clientLoading && (
          <p className="mt-2 text-sm text-slate-500">Loading client...</p>
        )}

        {clientError && !clientLoading && (
          <div className="mt-2 text-sm text-red-600">{clientError}</div>
        )}

        {/* Main content */}
        {!clientLoading && client && (
          <>
            {/* Gradient header */}
            <div
              className="
              rounded-2xl 
              bg-gradient-to-br from-ef-primary via-ef-primary to-ef-primary-strong 
              p-6 shadow-medium text-white
              border border-white/20
              backdrop-blur-xl
              flex flex-col gap-3 md:flex-row md:items-start md:justify-between
            "
            >
              <div>
                <h1 className="text-3xl font-bold tracking-tight drop-shadow">
                  {client.name}
                </h1>
                <p className="text-sm opacity-90">
                  Client profile and billing overview.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={client.status === "active" ? "success" : "default"}
                >
                  {client.status.toUpperCase()}
                </Badge>
                
              </div>
            </div>

            {/* Main card */}
            <div
              className="
                rounded-2xl bg-white/80 backdrop-blur-sm
                shadow-medium border border-ef-border
                p-6 space-y-6
              "
            >

            {/* Tabs */}
            <div className="mt-2 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {[
                { key: "overview" as const, label: "Overview" },
                { key: "care" as const, label: "Care Management" },
                { key: "profile" as const, label: "Profile" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    activeTab === tab.key
                      ? "bg-ef-primary text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>



                            {/* At-a-Glance (mobile-first summary) */}
              {activeTab === "overview" && (
              <Card title="At a Glance">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Safety snapshot */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Safety
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                        Allergies:{" "}
                        <span className="ml-1 font-semibold">
                          {clientSnapshot.allergyCount}
                        </span>
                        {clientSnapshot.topAllergyLabel && (
                          <span className="ml-1 text-red-600">
                            · {clientSnapshot.topAllergyLabel}
                          </span>
                        )}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                        Risks:{" "}
                        <span className="ml-1 font-semibold">
                          {clientSnapshot.riskCount}
                        </span>
                        {clientSnapshot.topRiskLabel && (
                          <span className="ml-1 text-amber-700">
                            · {clientSnapshot.topRiskLabel}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Meds + insurance snapshot */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Meds & Coverage
                    </h4>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                        Medications:{" "}
                        <span className="ml-1 font-semibold">
                          {clientSnapshot.medCount}
                        </span>
                        {clientSnapshot.medExamples.length > 0 && (
                          <span className="ml-1 text-slate-600">
                            ·{" "}
                            {clientSnapshot.medExamples.join(
                              ", "
                            )}
                          </span>
                        )}
                      </span>
                      {clientSnapshot.primaryInsuranceLabel && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                          {clientSnapshot.primaryInsuranceLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary contact */}
                  <div className="space-y-2 md:col-span-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Primary Contact
                    </h4>
                    {clientSnapshot.primaryContactName ? (
                      <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-800">
                        <span className="font-medium">
                          {clientSnapshot.primaryContactName}
                        </span>
                        {clientSnapshot.primaryContactPhone && (
                          <span className="text-xs text-slate-600">
                            {clientSnapshot.primaryContactPhone}
                          </span>
                        )}
                        {clientSnapshot.primaryContactEmail && (
                          <span className="text-xs text-slate-600 break-all">
                            {clientSnapshot.primaryContactEmail}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No primary contact on file.
                      </p>
                    )}
                  </div>
                </div>
              </Card>


                  )/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      router.push(`/clients/${clientId}/add-activity`)
                    }
                    className="text-xs"
                  >
                    + Add activity
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/clients/${clientId}/edit`)}
                    className="text-xs"
                  >
                    Edit client
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/activities?clientId=${clientId}`)
                    }
                    className="text-xs"
                  >
                    View all activities
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/billing?clientId=${clientId}`)
                    }
                    className="text-xs"
                  >
                    View all invoices
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportFaceSheet}
                    className="text-xs"
                  >
                    {faceSheetLoading
                      ? "Generating Face Sheet..."
                      : "Export Emergency Face Sheet (PDF)"}
                  </Button>
                </div>
              </div>


              {/* Primary CM card */}
               {activeTab === "overview" && client.primaryCM && (
                <Card title="Primary Care Manager">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white overflow-hidden">
                      {client.primaryCM.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.primaryCM.profileImageUrl}
                          alt={client.primaryCM.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        initials(client.primaryCM.name)
                      )}
                    </div>
                    <div className="flex flex-col">
                      {isAdmin ? (
                        <Link
                          href={`/team/${client.primaryCM.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {client.primaryCM.name}
                        </Link>
                      ) : (
                        <span className="font-medium">
                          {client.primaryCM.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        Primary Care Manager
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              
              {/* Summary cards */}
              {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card title="Hours Logged">
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {clientSummary.totalHours.toFixed(1)} hrs
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    From Activities for this client.
                  </p>
                </Card>

                <Card title="Open Invoices">
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {clientSummary.openInvoicesCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Invoices with status &quot;sent&quot; or &quot;overdue&quot;.
                  </p>
                </Card>

                <Card title="Last Activity">
                  <p className="mt-1 text-sm text-slate-800">
                    {clientSummary.lastActivityDate || "No activity yet."}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    From the latest Activity start time.
                  </p>
                </Card>
              </div>

              )/* Billing contact + summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card title="Billing Contact">
                  <p className="mt-1 text-sm text-slate-800">
                    {client.billingContactName || "Not set"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {client.billingContactEmail || "No email on file"}
                  </p>
                </Card>

                <Card title="Summary">
  <p className="mt-1 text-sm text-slate-700">
    All billing, safety, and activity data for this client is
    linked here. Use the sections below to drill into details
    only when needed.
  </p>
</Card>

              </div>

              {/* Recent activity timeline */}
              <Card title="Recent Activity for This Client">
                {activitiesError && (
                  <p className="text-xs text-red-600">{activitiesError}</p>
                )}
                {!activitiesError && recentActivities.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No recent activity for this client.
                  </p>
                )}
                {!activitiesError && recentActivities.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {recentActivities.map((a) => {
                      const dateStr = a.startTime.slice(0, 10);
                      const hours = (a.duration || 0) / 60;
                      const serviceName =
                        a.serviceType?.name ?? "Care Management Services";
                      return (
                        <li
                          key={a.id}
                          className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2"
                        >
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">
                                {dateStr}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-sm font-medium text-slate-900">
                                {hours.toFixed(2)}h
                              </span>
                              <span className="text-xs text-slate-500">
                                {serviceName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {a.isBillable ? "Billable" : "Non-billable"}
                              {a.notes
                                ? ` · ${a.notes.slice(0, 80)}${
                                    a.notes.length > 80 ? "…" : ""
                                  }`
                                : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>


              {/* Billing summary */}
              <Card title="Billing Summary">
                {invoicesError && (
                  <p className="text-xs text-red-600">{invoicesError}</p>
                )}
                {!invoicesError && invoices.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No invoices found for this client yet.
                  </p>
                )}
                {!invoicesError && invoices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="border-b border-slate-200 px-3 py-2">
                            Invoice #
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2">
                            Amount
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2">
                            Status
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2">
                            Period End
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="border-b border-slate-200 px-3 py-2">
                              {inv.id}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2">
                              ${inv.totalAmount.toFixed(2)}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2">
                              <InvoiceStatusBadge status={inv.status} />
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2">
                              {inv.periodEnd.slice(0, 10)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  These invoices are loaded from your real /api/invoices
                  endpoint.
                </p>
              </Card>



              {activeTab === "profile" && (
                <>  
              {/* Family & Contacts */}
              <Card title="Family & Contacts">
                {contactsError && (
                  <p className="text-xs text-red-600">{contactsError}</p>
                )}
                {!contactsError && (
                  <>
                    <form
                      onSubmit={handleAddContact}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Name
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Relationship
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newContactRelationship}
                          onChange={(e) =>
                            setNewContactRelationship(e.target.value)
                          }
                          placeholder="Daughter, Son, POA..."
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Phone
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newContactPhone}
                          onChange={(e) =>
                            setNewContactPhone(e.target.value)
                          }
                          placeholder="555-123-4567"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Email
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newContactEmail}
                          onChange={(e) =>
                            setNewContactEmail(e.target.value)
                          }
                          placeholder="name@example.com"
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Address
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newContactAddress}
                          onChange={(e) =>
                            setNewContactAddress(e.target.value)
                          }
                          placeholder="Street, city, state, ZIP"
                        />
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newContactNotes}
                          onChange={(e) =>
                            setNewContactNotes(e.target.value)
                          }
                          placeholder="Anything important about this contact (POA, lives nearby, prefers text, etc.)"
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300"
                            checked={newContactIsEmergency}
                            onChange={(e) =>
                              setNewContactIsEmergency(e.target.checked)
                            }
                          />
                          Mark as emergency contact
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          {contactMessage && (
                            <span className="text-xs text-slate-500">
                              {contactMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingContact}
                            className="text-xs"
                          >
                            {savingContact ? "Saving..." : "Add contact"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {contactsLoading && (
                      <p className="text-xs text-slate-500">
                        Loading contacts...
                      </p>
                    )}

                    {!contactsLoading && contacts.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No contacts added yet.
                      </p>
                    )}

                    {!contactsLoading && contacts.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Name
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Relationship
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Phone
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Email
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Address
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Emergency
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {contacts.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {c.name}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {c.relationship || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {c.phone || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {c.email || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {c.address || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {c.isEmergencyContact ? "Yes" : "No"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => openContactDetails(c)}
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteContact(c.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Contact details modal */}
                    {selectedContact && (
                      <Modal
                        open={contactDetailsOpen}
                        onClose={closeContactDetails}
                        title="Contact details"
                        description={
                          selectedContact.relationship
                            ? `${selectedContact.relationship} for ${
                                client?.name ?? "client"
                              }`
                            : undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Name
                            </dt>
                            <dd>{selectedContact.name}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Relationship
                            </dt>
                            <dd>{selectedContact.relationship || "—"}</dd>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Phone
                              </dt>
                              <dd>{selectedContact.phone || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Email
                              </dt>
                              <dd>{selectedContact.email || "—"}</dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Address
                            </dt>
                            <dd>{selectedContact.address || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Emergency contact
                            </dt>
                            <dd>
                              {selectedContact.isEmergencyContact
                                ? "Yes"
                                : "No"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Notes
                            </dt>
                            <dd className="whitespace-pre-line">
                              {selectedContact.notes || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Added on
                            </dt>
                            <dd>
                              {new Date(
                                selectedContact.createdAt
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

              {/* Providers & Care Team */}
              <Card title="Providers & Care Team">
                {providersError && (
                  <p className="text-xs text-red-600">{providersError}</p>
                )}
                {!providersError && (
                  <>
                    <form
                      onSubmit={handleAddProvider}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Type
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProviderType}
                          onChange={(e) => setNewProviderType(e.target.value)}
                          placeholder="Physician, Therapist, Attorney, Facility..."
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Name
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProviderName}
                          onChange={(e) => setNewProviderName(e.target.value)}
                          placeholder="e.g. Dr. Smith"
                          required
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Specialty
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProviderSpecialty}
                          onChange={(e) =>
                            setNewProviderSpecialty(e.target.value)
                          }
                          placeholder="Geriatrics, Elder law, Home care..."
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Phone
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProviderPhone}
                          onChange={(e) =>
                            setNewProviderPhone(e.target.value)
                          }
                          placeholder="555-123-4567"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Email
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProviderEmail}
                          onChange={(e) =>
                            setNewProviderEmail(e.target.value)
                          }
                          placeholder="provider@example.com"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Address
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProviderAddress}
                          onChange={(e) =>
                            setNewProviderAddress(e.target.value)
                          }
                          placeholder="Office address"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newProviderNotes}
                          onChange={(e) =>
                            setNewProviderNotes(e.target.value)
                          }
                          placeholder="Referral notes, best contact times, hospital affiliation, etc."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <div className="ml-auto flex items-center gap-2">
                          {providerMessage && (
                            <span className="text-xs text-slate-500">
                              {providerMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingProvider}
                            className="text-xs"
                          >
                            {savingProvider ? "Saving..." : "Add provider"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {providersLoading && (
                      <p className="text-xs text-slate-500">
                        Loading providers...
                      </p>
                    )}

                    {!providersLoading && providers.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No providers added yet.
                      </p>
                    )}

                    {!providersLoading && providers.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Type
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Name
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Specialty
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Phone
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Email
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {providers.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.type}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.name}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.specialty || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.phone || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.email || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => openProviderDetails(p)}
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteProvider(p.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                      title={p.notes || undefined}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Provider details modal */}
                    {selectedProvider && (
                      <Modal
                        open={providerDetailsOpen}
                        onClose={closeProviderDetails}
                        title="Provider details"
                        description={
                          selectedProvider.type
                            ? `${selectedProvider.type} for ${
                                client?.name ?? "client"
                              }`
                            : undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Name
                            </dt>
                            <dd>{selectedProvider.name}</dd>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Type
                              </dt>
                              <dd>{selectedProvider.type || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Specialty
                              </dt>
                              <dd>{selectedProvider.specialty || "—"}</dd>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Phone
                              </dt>
                              <dd>{selectedProvider.phone || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Email
                              </dt>
                              <dd>{selectedProvider.email || "—"}</dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Address
                            </dt>
                            <dd>{selectedProvider.address || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Notes
                            </dt>
                            <dd className="whitespace-pre-line">
                              {selectedProvider.notes || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Added on
                            </dt>
                            <dd>
                              {new Date(
                                selectedProvider.createdAt
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

              {/* Medications */}
              <Card title="Medications">
                {medicationsError && (
                  <p className="text-xs text-red-600">{medicationsError}</p>
                )}
                {!medicationsError && (
                  <>
                    <form
                      onSubmit={handleAddMedication}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Medication name
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          placeholder="e.g. Lisinopril"
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Dosage
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newMedDosage}
                          onChange={(e) => setNewMedDosage(e.target.value)}
                          placeholder="10 mg, 1 tab"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Frequency
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newMedFrequency}
                          onChange={(e) => setNewMedFrequency(e.target.value)}
                          placeholder="Once daily, BID, nightly"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Route
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newMedRoute}
                          onChange={(e) => setNewMedRoute(e.target.value)}
                          placeholder="PO, IV, topical"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Prescribing provider
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newMedPrescribingProvider}
                          onChange={(e) =>
                            setNewMedPrescribingProvider(e.target.value)
                          }
                          placeholder="e.g. Dr. Smith, PCP"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newMedNotes}
                          onChange={(e) => setNewMedNotes(e.target.value)}
                          placeholder="Indication, timing instructions, side effects to watch, etc."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <div className="ml-auto flex items-center gap-2">
                          {medicationMessage && (
                            <span className="text-xs text-slate-500">
                              {medicationMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingMedication}
                            className="text-xs"
                          >
                            {savingMedication ? "Saving..." : "Add medication"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {medicationsLoading && (
                      <p className="text-xs text-slate-500">
                        Loading medications...
                      </p>
                    )}

                    {!medicationsLoading && medications.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No medications added yet.
                      </p>
                    )}

                    {!medicationsLoading && medications.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Name
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Dosage
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Frequency
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Route
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {medications.map((m) => (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {m.name}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {m.dosage || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {m.frequency || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {m.route || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => openMedDetails(m)}
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMedication(m.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                      title={m.notes || undefined}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Medication details modal */}
                    {selectedMed && (
                      <Modal
                        open={medDetailsOpen}
                        onClose={closeMedDetails}
                        title="Medication details"
                        description={
                          selectedMed.name
                            ? `${selectedMed.name} for ${
                                client?.name ?? "client"
                              }`
                            : undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Name
                            </dt>
                            <dd>{selectedMed.name}</dd>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Dosage
                              </dt>
                              <dd>{selectedMed.dosage || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Frequency
                              </dt>
                              <dd>{selectedMed.frequency || "—"}</dd>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Route
                              </dt>
                              <dd>{selectedMed.route || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Prescribing provider
                              </dt>
                              <dd>
                                {selectedMed.prescribingProvider || "—"}
                              </dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Notes
                            </dt>
                            <dd className="whitespace-pre-line">
                              {selectedMed.notes || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Added on
                            </dt>
                            <dd>
                              {new Date(
                                selectedMed.createdAt
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

                            {/* Allergies & Sensitivities */}
              <Card title="Allergies & Sensitivities">
                {/* Critical allergy badge */}
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
    <div className="inline-flex max-w-full items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
      <span>
        Allergies ({clientSnapshot.allergyCount})
      </span>
      {clientSnapshot.topAllergyLabel && (
        <span className="ml-1 truncate max-w-[11rem]">
          🔴 {clientSnapshot.topAllergyLabel}
        </span>
      )}
    </div>
  </div>
                {allergiesError && (
                  <p className="text-xs text-red-600">{allergiesError}</p>
                )}
                {!allergiesError && (
                  <>
                    <form
                      onSubmit={handleAddAllergy}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Allergen
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newAllergen}
                          onChange={(e) => setNewAllergen(e.target.value)}
                          placeholder="e.g. Penicillin, Peanuts"
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Reaction
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newAllergyReaction}
                          onChange={(e) =>
                            setNewAllergyReaction(e.target.value)
                          }
                          placeholder="Rash, anaphylaxis, GI upset..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Severity
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newAllergySeverity}
                          onChange={(e) =>
                            setNewAllergySeverity(e.target.value)
                          }
                          placeholder="Mild, Moderate, Severe"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newAllergyNotes}
                          onChange={(e) =>
                            setNewAllergyNotes(e.target.value)
                          }
                          placeholder="Onset, known exposures, meds to avoid, etc."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <div className="ml-auto flex items-center gap-2">
                          {allergyMessage && (
                            <span className="text-xs text-slate-500">
                              {allergyMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingAllergy}
                            className="text-xs"
                          >
                            {savingAllergy ? "Saving..." : "Add allergy"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {allergiesLoading && (
                      <p className="text-xs text-slate-500">
                        Loading allergies...
                      </p>
                    )}

                    {!allergiesLoading && allergies.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No allergies recorded yet.
                      </p>
                    )}

                    {!allergiesLoading && allergies.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Allergen
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Reaction
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Severity
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allergies.map((a) => (
                              <tr key={a.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {a.allergen}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {a.reaction || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {a.severity || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => openAllergyDetails(a)}
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteAllergy(a.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                      title={a.notes || undefined}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Allergy details modal */}
                    {selectedAllergy && (
                      <Modal
                        open={allergyDetailsOpen}
                        onClose={closeAllergyDetails}
                        title="Allergy details"
                        description={
                          selectedAllergy.allergen
                            ? `${selectedAllergy.allergen} for ${
                                client?.name ?? "client"
                              }`
                            : undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Allergen
                            </dt>
                            <dd>{selectedAllergy.allergen}</dd>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Reaction
                              </dt>
                              <dd>{selectedAllergy.reaction || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Severity
                              </dt>
                              <dd>{selectedAllergy.severity || "—"}</dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Notes
                            </dt>
                            <dd className="whitespace-pre-line">
                              {selectedAllergy.notes || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Added on
                            </dt>
                            <dd>
                              {new Date(
                                selectedAllergy.createdAt
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

                            {/* Insurance & Coverage */}
              <Card title="Insurance & Coverage">
                {insuranceError && (
                  <p className="text-xs text-red-600">{insuranceError}</p>
                )}
                {!insuranceError && (
                  <>
                    <form
                      onSubmit={handleAddInsurance}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Carrier
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newInsuranceCarrier}
                          onChange={(e) =>
                            setNewInsuranceCarrier(e.target.value)
                          }
                          placeholder="e.g. Medicare, Blue Cross"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Plan type
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newInsuranceType}
                          onChange={(e) =>
                            setNewInsuranceType(e.target.value)
                          }
                          placeholder="Medicare, PPO, HMO..."
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Policy #
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newInsurancePolicyNumber}
                          onChange={(e) =>
                            setNewInsurancePolicyNumber(e.target.value)
                          }
                          placeholder="Policy number"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Group #
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newInsuranceGroupNumber}
                          onChange={(e) =>
                            setNewInsuranceGroupNumber(e.target.value)
                          }
                          placeholder="Group number"
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Member ID
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newInsuranceMemberId}
                          onChange={(e) =>
                            setNewInsuranceMemberId(e.target.value)
                          }
                          placeholder="Member ID"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Phone
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newInsurancePhone}
                          onChange={(e) =>
                            setNewInsurancePhone(e.target.value)
                          }
                          placeholder="Customer service phone"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newInsuranceNotes}
                          onChange={(e) =>
                            setNewInsuranceNotes(e.target.value)
                          }
                          placeholder="Coverage notes, secondary insurance, copays, deductible info..."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-slate-300"
                            checked={newInsurancePrimary}
                            onChange={(e) =>
                              setNewInsurancePrimary(e.target.checked)
                            }
                          />
                          Mark as primary insurance
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          {insuranceMessage && (
                            <span className="text-xs text-slate-500">
                              {insuranceMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingInsurance}
                            className="text-xs"
                          >
                            {savingInsurance ? "Saving..." : "Add insurance"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {insuranceLoading && (
                      <p className="text-xs text-slate-500">
                        Loading insurance...
                      </p>
                    )}

                    {!insuranceLoading && insurance.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No insurance records yet.
                      </p>
                    )}

                    {!insuranceLoading && insurance.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Carrier
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Plan
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Policy #
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Primary
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {insurance.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {r.carrier || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {r.insuranceType || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {r.policyNumber || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {r.primary ? "Yes" : "No"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openInsuranceDetails(r)
                                      }
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteInsurance(r.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                      title={r.notes || undefined}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Insurance details modal */}
                    {selectedInsurance && (
                      <Modal
                        open={insuranceDetailsOpen}
                        onClose={closeInsuranceDetails}
                        title="Insurance details"
                        description={
                          selectedInsurance.carrier
                            ? `${selectedInsurance.carrier} for ${
                                client?.name ?? "client"
                              }`
                            : undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Carrier
                            </dt>
                            <dd>{selectedInsurance.carrier || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Plan type
                            </dt>
                            <dd>{selectedInsurance.insuranceType || "—"}</dd>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Policy #
                              </dt>
                              <dd>{selectedInsurance.policyNumber || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Group #
                              </dt>
                              <dd>{selectedInsurance.groupNumber || "—"}</dd>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Member ID
                              </dt>
                              <dd>{selectedInsurance.memberId || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Phone
                              </dt>
                              <dd>{selectedInsurance.phone || "—"}</dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Primary insurance
                            </dt>
                            <dd>{selectedInsurance.primary ? "Yes" : "No"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Notes
                            </dt>
                            <dd className="whitespace-pre-line">
                              {selectedInsurance.notes || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Added on
                            </dt>
                            <dd>
                              {new Date(
                                selectedInsurance.createdAt
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

                            {/* Risks & Safety Flags */}
              <Card title="Risks & Safety Flags">
                {/* Critical risk badge */}
  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
    <div className="inline-flex max-w-full items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
      <span>
        Risks ({clientSnapshot.riskCount})
      </span>
      {clientSnapshot.topRiskLabel && (
        <span className="ml-1 truncate max-w-[11rem]">
          🟠 {clientSnapshot.topRiskLabel}
        </span>
      )}
    </div>
  </div>
                {risksError && (
                  <p className="text-xs text-red-600">{risksError}</p>
                )}
                {!risksError && (
                  <>
                    <form
                      onSubmit={handleAddRisk}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Category
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newRiskCategory}
                          onChange={(e) =>
                            setNewRiskCategory(e.target.value)
                          }
                          placeholder="Fall risk, Wandering, Financial, Legal, Housing..."
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Severity
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newRiskSeverity}
                          onChange={(e) =>
                            setNewRiskSeverity(e.target.value)
                          }
                          placeholder="Low, Medium, High"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Notes
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newRiskNotes}
                          onChange={(e) =>
                            setNewRiskNotes(e.target.value)
                          }
                          placeholder="Context: recent falls, home safety issues, caregiver burnout, wandering behavior, etc."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <div className="ml-auto flex items-center gap-2">
                          {riskMessage && (
                            <span className="text-xs text-slate-500">
                              {riskMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingRisk}
                            className="text-xs"
                          >
                            {savingRisk ? "Saving..." : "Add risk"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {risksLoading && (
                      <p className="text-xs text-slate-500">
                        Loading risks...
                      </p>
                    )}

                    {!risksLoading && risks.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No risks recorded yet.
                      </p>
                    )}

                    {!risksLoading && risks.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Category
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Severity
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {risks.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {r.category}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {r.severity || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() => openRiskDetails(r)}
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteRisk(r.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                      title={r.notes || undefined}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Risk details modal */}
                    {selectedRisk && (
                      <Modal
                        open={riskDetailsOpen}
                        onClose={closeRiskDetails}
                        title="Risk details"
                        description={
                          selectedRisk.category
                            ? `${selectedRisk.category} for ${
                                client?.name ?? "client"
                              }`
                            : undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Category
                            </dt>
                            <dd>{selectedRisk.category}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Severity
                            </dt>
                            <dd>{selectedRisk.severity || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Notes
                            </dt>
                            <dd className="whitespace-pre-line">
                              {selectedRisk.notes || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Added on
                            </dt>
                            <dd>
                              {new Date(
                                selectedRisk.createdAt
                              ).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

                            {/* Documents */}
              <Card title="Documents">
                {documentsError && (
                  <p className="text-xs text-red-600">{documentsError}</p>
                )}
                {!documentsError && (
                  <>
                    <form
                      onSubmit={handleAddDocument}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Title
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Power of Attorney, Advance Directive"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Document URL
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newDocUrl}
                          onChange={(e) => setNewDocUrl(e.target.value)}
                          placeholder="Paste link to PDF, Google Drive, or file"
                          required
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Category
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newDocCategory}
                          onChange={(e) =>
                            setNewDocCategory(e.target.value)
                          }
                          placeholder="Legal, Medical, Financial..."
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          File type
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newDocFileType}
                          onChange={(e) =>
                            setNewDocFileType(e.target.value)
                          }
                          placeholder="pdf, docx, jpg..."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <div className="ml-auto flex items-center gap-2">
                          {documentMessage && (
                            <span className="text-xs text-slate-500">
                              {documentMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingDocument}
                            className="text-xs"
                          >
                            {savingDocument ? "Saving..." : "Add document"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {documentsLoading && (
                      <p className="text-xs text-slate-500">
                        Loading documents...
                      </p>
                    )}

                    {!documentsLoading && documents.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No documents added yet.
                      </p>
                    )}

                    {!documentsLoading && documents.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Title
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Category
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Type
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((d) => (
                              <tr key={d.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {d.title}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {d.category || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {d.fileType || "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openDocumentDetails(d)
                                      }
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteDocument(d.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                      title={d.fileUrl}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Document details modal */}
                    {selectedDocument && (
                      <Modal
                        open={documentDetailsOpen}
                        onClose={closeDocumentDetails}
                        title="Document details"
                        description={
                          selectedDocument.title ||
                          undefined
                        }
                      >
                        <dl className="space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Title
                            </dt>
                            <dd>{selectedDocument.title}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              Category
                            </dt>
                            <dd>{selectedDocument.category || "—"}</dd>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                File type
                              </dt>
                              <dd>{selectedDocument.fileType || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold text-slate-500">
                                Uploaded at
                              </dt>
                              <dd>
                                {new Date(
                                  selectedDocument.uploadedAt
                                ).toLocaleString()}
                              </dd>
                            </div>
                          </div>
                          <div>
                            <dt className="text-xs font-semibold text-slate-500">
                              URL
                            </dt>
                            <dd>
                              <a
                                href={selectedDocument.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                {selectedDocument.fileUrl}
                              </a>
                            </dd>
                          </div>
                        </dl>
                      </Modal>
                    )}
                  </>
                )}
              </Card>
              </>
              )}


                            {/* Care Plans */}
              <Card title="Care Plans">
                {carePlansError && (
                  <p className="text-xs text-red-600">{carePlansError}</p>
                )}
                {!carePlansError && (
                  <>
                    <form
                      onSubmit={handleAddCarePlan}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Plan title
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newCarePlanTitle}
                          onChange={(e) =>
                            setNewCarePlanTitle(e.target.value)
                          }
                          placeholder="e.g. Fall prevention plan"
                          required
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Status
                        </label>
                        <select
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newCarePlanStatus}
                          onChange={(e) =>
                            setNewCarePlanStatus(e.target.value)
                          }
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Target date
                        </label>
                        <input
                          type="date"
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newCarePlanTargetDate}
                          onChange={(e) =>
                            setNewCarePlanTargetDate(e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Summary
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={2}
                          value={newCarePlanSummary}
                          onChange={(e) =>
                            setNewCarePlanSummary(e.target.value)
                          }
                          placeholder="High-level description of goals, focus areas, and priorities."
                        />
                      </div>

                      <div className="flex items-center gap-2 md:col-span-2">
                        <div className="ml-auto flex items-center gap-2">
                          {carePlanMessage && (
                            <span className="text-xs text-slate-500">
                              {carePlanMessage}
                            </span>
                          )}
                          <Button
                            type="submit"
                            disabled={savingCarePlan}
                            className="text-xs"
                          >
                            {savingCarePlan
                              ? "Saving..."
                              : "Add care plan"}
                          </Button>
                        </div>
                      </div>
                    </form>

                    {carePlansLoading && (
                      <p className="text-xs text-slate-500">
                        Loading care plans...
                      </p>
                    )}

                    {!carePlansLoading && carePlans.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No care plans yet.
                      </p>
                    )}

                    {!carePlansLoading && carePlans.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Title
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Status
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Target date
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {carePlans.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.title}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.status}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2">
                                  {p.targetDate
                                    ? p.targetDate.slice(0, 10)
                                    : "-"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openCarePlanDetails(p)
                                      }
                                      className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteCarePlan(p.id)
                                      }
                                      className="text-xs font-medium text-red-600 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Care Plan details modal */}
                    {selectedCarePlan && (
                      <Modal
                        open={carePlanDetailsOpen}
                        onClose={closeCarePlanDetails}
                        title="Care Plan details"
                        description={selectedCarePlan.title}
                      >
                        <div className="space-y-4 text-sm text-slate-800">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500">
                              Status
                            </h4>
                            <p>{selectedCarePlan.status}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Start date
                              </h4>
                              <p>
                                {selectedCarePlan.startDate
                                  ? selectedCarePlan.startDate.slice(0, 10)
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Target date
                              </h4>
                              <p>
                                {selectedCarePlan.targetDate
                                  ? selectedCarePlan.targetDate.slice(0, 10)
                                  : "—"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500">
                              Summary
                            </h4>
                            <p className="whitespace-pre-line">
                              {selectedCarePlan.summary || "—"}
                            </p>
                          </div>

                          {/* Goals */}
                          <div className="mt-4 border-t border-slate-200 pt-3">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Goals
                            </h4>

                            {carePlanGoalsError && (
                              <p className="text-xs text-red-600">
                                {carePlanGoalsError}
                              </p>
                            )}

                            <form
                              onSubmit={handleAddGoal}
                              className="mb-3 grid gap-3 md:grid-cols-2"
                            >
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                  Goal title
                                </label>
                                <input
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                  value={newGoalTitle}
                                  onChange={(e) =>
                                    setNewGoalTitle(e.target.value)
                                  }
                                  placeholder="e.g. Reduce fall frequency"
                                  required
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                  Description
                                </label>
                                <textarea
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                  rows={2}
                                  value={newGoalDescription}
                                  onChange={(e) =>
                                    setNewGoalDescription(e.target.value)
                                  }
                                  placeholder="Detailed description of the goal."
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                  Status
                                </label>
                                <select
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                  value={newGoalStatus}
                                  onChange={(e) =>
                                    setNewGoalStatus(e.target.value)
                                  }
                                >
                                  <option value="active">Active</option>
                                  <option value="completed">Completed</option>
                                  <option value="deferred">Deferred</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                  Priority
                                </label>
                                <input
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                  value={newGoalPriority}
                                  onChange={(e) =>
                                    setNewGoalPriority(e.target.value)
                                  }
                                  placeholder="Low, Medium, High"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                  Target date
                                </label>
                                <input
                                  type="date"
                                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                  value={newGoalTargetDate}
                                  onChange={(e) =>
                                    setNewGoalTargetDate(e.target.value)
                                  }
                                />
                              </div>
                              <div className="md:col-span-2 flex items-center justify-end gap-2">
                                {goalMessage && (
                                  <span className="text-xs text-slate-500">
                                    {goalMessage}
                                  </span>
                                )}
                                <Button
                                  type="submit"
                                  disabled={savingGoal}
                                  className="text-xs"
                                >
                                  {savingGoal ? "Saving..." : "Add goal"}
                                </Button>
                              </div>
                            </form>

                            {carePlanGoalsLoading && (
                              <p className="text-xs text-slate-500">
                                Loading goals...
                              </p>
                            )}

                            {!carePlanGoalsLoading &&
                              carePlanGoals.length === 0 && (
                                <p className="text-xs text-slate-500">
                                  No goals yet for this plan.
                                </p>
                              )}

                            {!carePlanGoalsLoading &&
                              carePlanGoals.length > 0 && (
                                <ul className="space-y-2 text-sm">
                                  {carePlanGoals.map((g) => (
                                    <li
                                      key={g.id}
                                      className="rounded-md border border-slate-200 px-3 py-2"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-medium text-slate-800">
                                            {g.title}
                                          </p>
                                          {g.description && (
                                            <p className="text-xs text-slate-600">
                                              {g.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                          <div>{g.status}</div>
                                          <div>
                                            {g.priority
                                              ? `Priority: ${g.priority}`
                                              : ""}
                                          </div>
                                          <div>
                                            {g.targetDate
                                              ? `Target: ${g.targetDate.slice(
                                                  0,
                                                  10
                                                )}`
                                              : ""}
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </div>
                        </div>
                      </Modal>
                    )}
                  </>
                )}
              </Card>


                              {/* Progress Notes */}
              <Card title="Progress Notes">
                {progressNotesError && (
                  <p className="text-xs text-red-600">
                    {progressNotesError}
                  </p>
                )}
                {!progressNotesError && (
                  <>
                    <form
                      onSubmit={handleAddProgressNote}
                      className="mb-4 grid gap-3 md:grid-cols-2"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Date
                        </label>
                        <input
                          type="date"
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProgDate}
                          onChange={(e) =>
                            setNewProgDate(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Type
                        </label>
                        <input
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProgType}
                          onChange={(e) =>
                            setNewProgType(e.target.value)
                          }
                          placeholder="Visit, phone, check-in..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Care plan (optional)
                        </label>
                        <select
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newProgCarePlanId}
                          onChange={(e) =>
                            setNewProgCarePlanId(e.target.value)
                          }
                        >
                          <option value="">(None)</option>
                          {carePlans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Content
                        </label>
                        <textarea
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          rows={3}
                          value={newProgContent}
                          onChange={(e) =>
                            setNewProgContent(e.target.value)
                          }
                          placeholder="Detailed note on today's contact, changes, interventions, concerns, etc."
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-end gap-2">
                        {progressNoteMessage && (
                          <span className="mr-auto text-xs text-slate-500">
                            {progressNoteMessage}
                          </span>
                        )}
                        <Button
                          type="submit"
                          disabled={savingProgressNote}
                          className="text-xs"
                        >
                          {savingProgressNote
                            ? "Saving..."
                            : "Add progress note"}
                        </Button>
                      </div>
                    </form>

                    {progressNotesLoading && (
                      <p className="text-xs text-slate-500">
                        Loading progress notes...
                      </p>
                    )}

                    {!progressNotesLoading &&
                      progressNotes.length === 0 && (
                        <p className="text-xs text-slate-500">
                          No progress notes yet.
                        </p>
                      )}

                    {!progressNotesLoading &&
                      progressNotes.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <th className="border-b border-slate-200 px-3 py-2">
                                  Date
                                </th>
                                <th className="border-b border-slate-200 px-3 py-2">
                                  Type
                                </th>
                                <th className="border-b border-slate-200 px-3 py-2">
                                  Author
                                </th>
                                <th className="border-b border-slate-200 px-3 py-2">
                                  Care plan
                                </th>
                                <th className="border-b border-slate-200 px-3 py-2">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {progressNotes.map((n) => (
                                <tr
                                  key={n.id}
                                  className="hover:bg-slate-50"
                                >
                                  <td className="border-b border-slate-200 px-3 py-2">
                                    {n.date
                                      ? n.date.slice(0, 10)
                                      : ""}
                                  </td>
                                  <td className="border-b border-slate-200 px-3 py-2">
                                    {n.noteType || "-"}
                                  </td>
                                  <td className="border-b border-slate-200 px-3 py-2">
                                    {n.authorName || "-"}
                                  </td>
                                  <td className="border-b border-slate-200 px-3 py-2">
                                    {n.carePlanTitle || "-"}
                                  </td>
                                  <td className="border-b border-slate-200 px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openProgressNoteDetails(n)
                                        }
                                        className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                      >
                                        View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteProgressNote(n.id)
                                        }
                                        className="text-xs font-medium text-red-600 hover:text-red-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {/* Progress note details modal */}
                    {selectedProgressNote && (
                      <Modal
                        open={progressNoteDetailsOpen}
                        onClose={closeProgressNoteDetails}
                        title="Progress note"
                        description={
                          selectedProgressNote.noteType ||
                          undefined
                        }
                      >
                        <div className="space-y-3 text-sm text-slate-800">
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Date
                              </h4>
                              <p>
                                {selectedProgressNote.date
                                  ? selectedProgressNote.date.slice(
                                      0,
                                      10
                                    )
                                  : "—"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Type
                              </h4>
                              <p>{selectedProgressNote.noteType || "—"}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Author
                              </h4>
                              <p>{selectedProgressNote.authorName || "—"}</p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Care plan
                              </h4>
                              <p>
                                {selectedProgressNote.carePlanTitle || "—"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500">
                              Content
                            </h4>
                            <p className="whitespace-pre-line">
                              {selectedProgressNote.content}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500">
                              Created at
                            </h4>
                            <p>
                              {new Date(
                                selectedProgressNote.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Modal>
                    )}
                  </>
                )}
              </Card>



              {/* Notes section */}
              <Card title="Notes">
                {notesError && (
                  <p className="text-xs text-red-600">{notesError}</p>
                )}
                {!notesError && (
                  <>
                    <form onSubmit={handleAddNote} className="mb-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Add a note
                        </label>
                        <textarea
                          className="min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="E.g. Call with family, new concern, care plan update..."
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {noteMessage && (
                          <span className="mr-auto text-xs text-slate-500">
                            {noteMessage}
                          </span>
                        )}
                        <Button
                          type="submit"
                          disabled={savingNote}
                          className="text-xs"
                        >
                          {savingNote ? "Saving..." : "Add note"}
                        </Button>
                      </div>
                    </form>

                    {notesLoading ? (
                      <p className="text-xs text-slate-500">Loading notes...</p>
                    ) : notes.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No notes yet. Use this section to capture important
                        updates, conversations, and care decisions.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-md border border-slate-200 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700">
                                  Note
                                  {n.authorName && (
                                    <span className="ml-1 text-[11px] font-normal text-slate-500">
                                      · {n.authorName}
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                              </div>

                              {(isAdmin || isCareManager) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="text-[11px] text-red-600 hover:text-red-700 hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="whitespace-pre-line text-sm text-slate-800">
                              {n.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>

                            {/* Audit Trail */}
              <Card title="Audit Trail">
                {auditLogsError && (
                  <p className="text-xs text-red-600">{auditLogsError}</p>
                )}
                {!auditLogsError && (
                  <>
                    {auditLogsLoading && (
                      <p className="text-xs text-slate-500">
                        Loading audit trail...
                      </p>
                    )}

                    {!auditLogsLoading && auditLogs.length === 0 && (
                      <p className="text-xs text-slate-500">
                        No recent medication or risk changes logged yet.
                      </p>
                    )}

                    {!auditLogsLoading && auditLogs.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-3 py-2">
                                Date
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                User
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Type
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Action
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Details
                              </th>
                              <th className="border-b border-slate-200 px-3 py-2">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                <td className="border-b border-slate-200 px-3 py-2 text-xs">
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-xs">
                                  {log.userName || "—"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-xs capitalize">
                                  {log.entityType}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-xs capitalize">
                                  {log.action}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-xs">
                                  {log.details
                                    ? log.details.length > 80
                                      ? log.details.slice(0, 80) + "…"
                                      : log.details
                                    : "—"}
                                </td>
                                <td className="border-b border-slate-200 px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => openAuditLogDetails(log)}
                                    className="text-xs font-medium text-slate-600 hover:text-slate-800"
                                    disabled={!log.details}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Audit log details modal */}
                    {selectedAuditLog && (
                      <Modal
                        open={auditLogDetailsOpen}
                        onClose={closeAuditLogDetails}
                        title="Audit log entry"
                        description={selectedAuditLog.entityType}
                      >
                        <div className="space-y-3 text-sm text-slate-800">
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Date
                              </h4>
                              <p>
                                {new Date(
                                  selectedAuditLog.createdAt
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                User
                              </h4>
                              <p>{selectedAuditLog.userName || "—"}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Entity type
                              </h4>
                              <p className="capitalize">
                                {selectedAuditLog.entityType}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500">
                                Action
                              </h4>
                              <p className="capitalize">
                                {selectedAuditLog.action}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-500">
                              Details
                            </h4>
                            <p className="whitespace-pre-line">
                              {selectedAuditLog.details || "—"}
                            </p>
                          </div>
                        </div>
                      </Modal>
                    )}
                  </>
                )}
              </Card>

            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Paid
      </span>
    );
  }

  if (status === "overdue") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Overdue
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Sent
      </span>
    );
  }

  if (status === "draft") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        Draft
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {status}
    </span>
  );
}
