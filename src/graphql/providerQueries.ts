/**
 * GraphQL queries and mutations for the marketplace provider directory.
 * Matches the ProviderQuery / ProviderMutation in farm_backend/apps/market/provider_schema.py
 */

export const PROVIDERS_QUERY = `
  query Providers(
    $providerType: String
    $district: String
    $search: String
    $verifiedOnly: Boolean
  ) {
    providers(
      providerType: $providerType
      district: $district
      search: $search
      verifiedOnly: $verifiedOnly
    ) {
      id
      name
      providerType
      tagline
      description
      phone
      email
      website
      whatsapp
      district
      town
      address
      coverageDistricts
      mobileService
      emergencyAvailable
      serviceHours
      isVerified
      status
      avgRating
      reviewCount
      bookingCount
      tags
      specialties
      yearEstablished
      updatedAt
    }
  }
`;

export const PROVIDER_DETAIL_QUERY = `
  query ProviderDetail($id: UUID!) {
    provider(id: $id) {
      id name providerType tagline description phone email website whatsapp
      district town address coverageDistricts mobileService emergencyAvailable
      serviceHours isVerified status avgRating reviewCount bookingCount
      tags specialties yearEstablished
    }
    providerServices(providerId: $id) {
      id name description category pricingModel price priceMax currency
      unitLabel isAvailable leadTimeDays notes
    }
    providerReviews(providerId: $id) {
      id rating title body serviceUsed verifiedPurchase helpfulVotes createdAt
      reviewedBy { id }
    }
    providerCertifications(providerId: $id) {
      id name issuingBody certNumber issuedDate expiryDate status verified
    }
    providerStaff(providerId: $id) {
      id name role phone email bio qualifications licenceNo photoUrl
    }
    equipmentCatalog(providerId: $id) {
      id equipmentType name make model year capacity
      dailyRate perHaRate currency operatorIncluded fuelIncluded
      minHireDays isAvailable notes
    }
  }
`;

export const MY_HIRE_BOOKINGS_QUERY = `
  query MyHireBookings($status: String) {
    myHireBookings(status: $status) {
      id bookingRef provider { id name } equipment { id name }
      startDate endDate hectares status quotedAmount agreedAmount currency
      depositPaid finalPaid deliveryAddress notes providerNotes createdAt
    }
  }
`;

export const MY_VET_APPOINTMENTS_QUERY = `
  query MyVetAppointments($status: String) {
    myVetAppointments(status: $status) {
      id apptRef provider { id name } vetOfficer { id name role }
      apptType apptDate apptTime status species animalCount symptoms
      diagnosis treatmentGiven followUpDate totalAmount paid createdAt
    }
  }
`;

// ── Mutations ─────────────────────────────────────────────────────────────────

export const REGISTER_PROVIDER_MUTATION = `
  mutation RegisterProvider($input: ProviderInput!) {
    registerProvider(input: $input) {
      ok
      provider { id name slug status }
    }
  }
`;

export const CREATE_HIRE_BOOKING_MUTATION = `
  mutation CreateHireBooking($input: HireBookingInput!) {
    createHireBooking(input: $input) {
      ok
      booking {
        id bookingRef status startDate endDate
        provider { id name phone }
      }
    }
  }
`;

export const BOOK_VET_APPOINTMENT_MUTATION = `
  mutation BookVetAppointment($input: VetAppointmentInput!) {
    bookVetAppointment(input: $input) {
      ok
      appointment {
        id apptRef status apptDate apptType
        provider { id name phone }
      }
    }
  }
`;

export const POST_REVIEW_MUTATION = `
  mutation PostProviderReview($input: ProviderReviewInput!) {
    postProviderReview(input: $input) {
      ok
      review { id rating title body createdAt }
    }
  }
`;
