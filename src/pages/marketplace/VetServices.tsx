import React from 'react';
import { ProviderShell, Provider, ProviderDirectoryConfig } from './ProviderDirectory';

const MOCK_VETS: Provider[] = [
  {
    id: 'vs-1', providerType: 'vet',
    name: 'AgriVet Zambia',
    tagline: 'Mobile veterinary services — poultry, livestock & aquaculture',
    description: 'Full-service mobile veterinary practice covering Lusaka, Central, and Southern Provinces. Registered with the Veterinary Board of Zambia. Post-mortems, vaccination programmes, disease diagnosis, AI services.',
    phone: '+260 977 210001', email: 'vet@agrivet.zm', website: 'www.agrivet.zm',
    location: 'Lusaka, Lusaka Province', districts: ['Lusaka', 'Central', 'Southern', 'Kafue'],
    operatingHours: 'Mon–Fri 07:00–18:00 | Emergency: 24/7',
    licenseNumber: 'VBZ-2024-0041',
    verified: true, certified: true, ratingAvg: 4.8, ratingCount: 73, active: true, mine: false,
    tags: ['VBZ Registered', 'Mobile', 'Poultry', 'Livestock', 'Emergency', '24/7'],
    specialties: ['Poultry', 'Cattle', 'Swine', 'Aquaculture'],
    coverageType: 'mobile',
    services: [
      { id: 'avs1', name: 'Farm Visit & Diagnosis', description: 'On-farm visit, clinical examination, diagnosis, and treatment plan. Up to 2 hours.', price: 350, unit: 'per visit', category: 'Consultation', available: true },
      { id: 'avs2', name: 'Vaccination Programme', description: "Newcastle, Gumboro, IB, Marek's, Fowl Pox — all poultry vaccines. Per 1000-bird flock.", price: 280, unit: 'per 1000 birds', category: 'Vaccination', available: true },
      { id: 'avs3', name: 'Post-Mortem & Lab', description: 'On-site PM with samples submitted to ZCAS lab. Report within 5 days.', price: 450, unit: 'per PM', category: 'Diagnostics', available: true },
      { id: 'avs4', name: 'Cattle AI Service', description: 'Artificial insemination with quality-certified semen. Success rate ~65%.', price: 120, unit: 'per cow', category: 'Breeding', available: true },
      { id: 'avs5', name: 'Spray Programme Supervision', description: 'Biosecurity spray schedule, disinfectant selection, supervision.', price: 200, unit: 'per visit', category: 'Biosecurity', available: true },
    ],
    reviews: [
      { id: 'avr1', reviewerName: 'KwaZuma Farms', rating: 5, comment: 'Dr Zimba diagnosed our NDV outbreak within hours. Saved the flock. Highly recommend.', serviceUsed: 'Farm Visit & Diagnosis', createdAt: '2026-07-28T10:00:00Z' },
      { id: 'avr2', reviewerName: 'Sunrise Dairy', rating: 5, comment: 'AI conception rate excellent. 7 of 10 cows confirmed in calf.', serviceUsed: 'Cattle AI Service', createdAt: '2026-06-15T11:00:00Z' },
      { id: 'avr3', reviewerName: 'Lake Fresh Aqua', rating: 4, comment: 'Good advice on tilapia disease management. Would have preferred a faster lab turnaround.', serviceUsed: 'Post-Mortem & Lab', createdAt: '2026-05-20T09:00:00Z' },
    ],
    certifications: [
      { body: 'Vet Board of Zambia', certNumber: 'VBZ-2024-0041', certType: 'Veterinary Surgeon Registration', expires: '2026-12-31' },
      { body: 'ZABS', certNumber: 'ZABS-VET-2023-0089', certType: 'Veterinary Practice Certification' },
    ],
    createdAt: '2023-03-01T00:00:00Z',
  },
  {
    id: 'vs-2', providerType: 'vet',
    name: 'Central Veterinary Clinic',
    tagline: 'Full-service vet clinic — Lusaka',
    description: 'Established clinic with on-site laboratory, cold chain vaccine storage, and surgical facilities. Companion animals and commercial livestock. Monday–Saturday walk-in and by appointment.',
    phone: '+260 955 220002', email: 'reception@centralvet.zm',
    location: 'Lusaka, Lusaka Province', districts: ['Lusaka', 'Chilanga'],
    operatingHours: 'Mon–Sat 07:30–17:00 | Sundays emergency only',
    licenseNumber: 'VBZ-CLINIC-2023-0012',
    verified: true, certified: true, ratingAvg: 4.5, ratingCount: 112, active: true, mine: false,
    tags: ['VBZ Registered', 'Clinic', 'Laboratory', 'Cold Chain', 'Surgery', 'Walk-In'],
    specialties: ['Poultry', 'Cattle', 'Dogs', 'Pigs'],
    coverageType: 'clinic',
    services: [
      { id: 'cvc1', name: 'Consultation', description: 'Clinical examination and diagnosis in-clinic. Prescription included.', price: 200, unit: 'per visit', category: 'Consultation', available: true },
      { id: 'cvc2', name: 'Laboratory Diagnostics', description: 'Blood, faecal, swab samples — ELISA, PCR, sensitivity testing. 2–7 day TAT.', price: 150, unit: 'per test', category: 'Laboratory', available: true },
      { id: 'cvc3', name: 'Vaccine Supply & Storage', description: 'Cold chain vaccine storage. Supply all major poultry and livestock vaccines.', price: 0, unit: 'varies by vaccine', category: 'Vaccination', available: true },
      { id: 'cvc4', name: 'Minor Surgery', description: 'Dehorning, castration, wound repair, caesarean section.', price: 350, unit: 'per procedure', category: 'Surgery', available: true },
    ],
    reviews: [
      { id: 'cvr1', reviewerName: 'Sunrise Poultry', rating: 5, comment: 'Best clinic in Lusaka. Results fast, vets very knowledgeable.', serviceUsed: 'Laboratory Diagnostics', createdAt: '2026-08-05T09:00:00Z' },
    ],
    certifications: [
      { body: 'Vet Board of Zambia', certNumber: 'VBZ-CLINIC-2023-0012', certType: 'Veterinary Practice Licence', expires: '2026-06-30' },
    ],
    createdAt: '2022-06-01T00:00:00Z',
  },
  {
    id: 'vs-3', providerType: 'vet',
    name: 'Aqua Health Vets',
    tagline: 'Aquaculture & fishery health specialists',
    description: "Zambia's only dedicated aquaculture veterinary service. Fish disease diagnosis, water quality assessments, parasite treatment programmes, and pond management consultation for tilapia and catfish producers.",
    phone: '+260 966 230003', email: 'fish@aquahealthvets.zm',
    location: 'Siavonga, Southern Province', districts: ['Southern', 'Lusaka', 'Eastern'],
    operatingHours: 'Mon–Fri 07:00–17:00 | Site visits by appointment',
    licenseNumber: 'VBZ-2023-0087',
    verified: true, certified: true, ratingAvg: 4.9, ratingCount: 22, active: true, mine: false,
    tags: ['Aquaculture Specialist', 'Fish Disease', 'Water Quality', 'Tilapia', 'Catfish'],
    specialties: ['Tilapia', 'Catfish', 'Carp', 'Trout'],
    coverageType: 'mobile',
    services: [
      { id: 'ahv1', name: 'Pond/Cage Inspection', description: 'Water quality, fish sampling, health assessment, stocking density review. Full written report.', price: 500, unit: 'per visit', category: 'Health Inspection', available: true },
      { id: 'ahv2', name: 'Fish Disease Diagnosis', description: 'Clinical signs + microscopy + lab if needed. Treatment protocol included.', price: 400, unit: 'per visit', category: 'Diagnostics', available: true },
      { id: 'ahv3', name: 'Water Quality Programme', description: 'Monthly DO, pH, temperature, ammonia monitoring and advisory. Remote or on-site.', price: 800, unit: 'per month (up to 4 ponds)', category: 'Water Quality', available: true },
      { id: 'ahv4', name: 'Feed Conversion Audit', description: 'FCR calculation, feed quality assessment, feeding programme optimisation.', price: 300, unit: 'per audit', category: 'Nutrition', available: true },
    ],
    reviews: [
      { id: 'ahr1', reviewerName: 'Lake Fresh Aqua', rating: 5, comment: 'Diagnosed a Trichodina outbreak that we had attributed to poor feeding. Saved the batch.', serviceUsed: 'Fish Disease Diagnosis', createdAt: '2026-07-12T14:00:00Z' },
    ],
    certifications: [
      { body: 'Vet Board of Zambia', certNumber: 'VBZ-2023-0087', certType: 'Aquatic Animal Health Specialist' },
    ],
    createdAt: '2023-07-01T00:00:00Z',
  },
  {
    id: 'vs-4', providerType: 'vet',
    name: 'Para-Vet Rural Services',
    tagline: 'Affordable community animal health — Northern Province',
    description: 'Government-trained para-veterinary officers providing essential animal health services to rural communities at subsidised rates. Basic vaccinations, deworming, wound care, and referrals.',
    phone: '+260 977 215004', email: 'paravet.kasama@zamtel.zm',
    location: 'Kasama, Northern Province', districts: ['Northern', 'Luapula', 'Muchinga'],
    operatingHours: 'Mon–Fri 08:00–16:00',
    licenseNumber: 'DVS-PARAVET-2024-0312',
    verified: true, certified: true, ratingAvg: 4.2, ratingCount: 45, active: true, mine: false,
    tags: ['Subsidised Rates', 'Rural Access', 'Government Trained', 'Cattle', 'Goats'],
    specialties: ['Cattle', 'Goats', 'Pigs', 'Village Poultry'],
    coverageType: 'mobile',
    services: [
      { id: 'pvs1', name: 'Vaccination (FMD/CBPP/LSD)', description: 'Government-programme vaccines at community rates. Per animal.', price: 8, unit: 'per animal', category: 'Vaccination', available: true },
      { id: 'pvs2', name: 'Deworming Programme', description: 'Anthelmintic selection and dosing. Per animal.', price: 15, unit: 'per animal', category: 'Treatment', available: true },
      { id: 'pvs3', name: 'Basic Wound Care & Dressing', description: 'Wound cleaning, fly strike treatment, basic suturing.', price: 40, unit: 'per case', category: 'Treatment', available: true },
    ],
    reviews: [
      { id: 'pvr1', reviewerName: 'Mwamba Village Farmers', rating: 4, comment: 'Always comes when called, very affordable.', serviceUsed: 'Vaccination (FMD/CBPP/LSD)', createdAt: '2026-06-01T10:00:00Z' },
    ],
    certifications: [
      { body: 'DVS Zambia', certNumber: 'DVS-PARAVET-2024-0312', certType: 'Para-Veterinary Officer Certificate' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'vs-5', providerType: 'vet',
    name: 'TeleFarm Vet',
    tagline: 'Remote veterinary consultation — available nationwide',
    description: 'Video and WhatsApp consultation with registered veterinarians. Get a diagnosis, treatment protocol, and prescription within 2 hours. Ideal for remote farms or urgent first-assessment before a site visit.',
    phone: '+260 955 217005', email: 'consult@telefarmvet.zm', website: 'www.telefarmvet.zm',
    location: 'Remote (online)', districts: ['Nationwide'],
    operatingHours: 'Daily 06:00–21:00',
    licenseNumber: 'VBZ-TELE-2024-0005',
    verified: true, certified: true, ratingAvg: 4.6, ratingCount: 38, active: true, mine: false,
    tags: ['Teleconsultation', 'WhatsApp', 'Video Call', 'Nationwide', 'Fast Response', '2-Hour SLA'],
    specialties: ['Poultry', 'Cattle', 'Aquaculture', 'Swine'],
    coverageType: 'remote',
    services: [
      { id: 'tfv1', name: 'Video Consultation', description: '30-min video call with registered vet. You share photos/video of affected animals. Written report + prescription.', price: 150, unit: 'per session', category: 'Teleconsultation', available: true },
      { id: 'tfv2', name: 'WhatsApp Triage', description: 'Photo/video assessment within 2 hours. Initial advice and referral if needed.', price: 80, unit: 'per case', category: 'Teleconsultation', available: true },
      { id: 'tfv3', name: 'Monthly Flock Health Plan', description: 'Monthly scheduled video check-in, vaccination reminders, mortality tracking guidance.', price: 500, unit: 'per month', category: 'Subscription', available: true },
    ],
    reviews: [
      { id: 'tfr1', reviewerName: 'Remote Farm Zambia', rating: 5, comment: 'Got a diagnosis at 7pm on a Sunday. Newcastle confirmed, treatment started same night. Flock saved.', serviceUsed: 'WhatsApp Triage', createdAt: '2026-07-30T19:00:00Z' },
    ],
    certifications: [
      { body: 'Vet Board of Zambia', certNumber: 'VBZ-TELE-2024-0005', certType: 'Telehealth Veterinary Licence' },
    ],
    createdAt: '2024-05-01T00:00:00Z',
  },
];

export default function VetServices() {
  return (
    <ProviderShell cfg={{
      storageKey: 'agronexus_v2_providers_vet',
      providerType: 'vet',
      title: 'Vet Services',
      icon: '💉',
      accent: 'pink',
      categories: ['Consultation', 'Vaccination', 'Diagnostics', 'Laboratory', 'Surgery', 'Biosecurity', 'Teleconsultation', 'Nutrition', 'Breeding', 'Water Quality'],
      serviceUnitLabel: 'per visit',
      registerLabel: 'Register your practice',
      mockProviders: MOCK_VETS,
      renderExtras: (p) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {p.coverageType && (
            <span style={{
              padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
              background: p.coverageType === 'clinic' ? '#fdf4ff' : p.coverageType === 'remote' ? '#eff6ff' : '#fff0f3',
              color: p.coverageType === 'clinic' ? '#86198f' : p.coverageType === 'remote' ? '#1d4ed8' : '#be185d',
              border: `1px solid ${p.coverageType === 'clinic' ? '#e879f9' : p.coverageType === 'remote' ? '#93c5fd' : '#fbcfe8'}`,
            }}>
              {p.coverageType === 'clinic' ? '🏥 Clinic-based' : p.coverageType === 'remote' ? '💻 Teleconsultation' : '🚗 Mobile service'}
            </span>
          )}
          {p.specialties && p.specialties.length > 0 && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Treats: {p.specialties.join(' · ')}
            </span>
          )}
        </div>
      ),
    } as ProviderDirectoryConfig} />
  );
}
