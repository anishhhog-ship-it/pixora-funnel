import { Business } from '@/types';
import { businessService as coreBusinessService } from './index';

export const businessService = {
  createBusiness: coreBusinessService.createBusiness,
  createOrUpdateBusiness: coreBusinessService.createOrUpdateBusiness,
  getBusiness: coreBusinessService.getBusinessById,
  getBusinessById: coreBusinessService.getBusinessById,
  updateBusiness: coreBusinessService.updateBusinessStatus,
  updateBusinessStatus: coreBusinessService.updateBusinessStatus,
  extendBusinessTrial: coreBusinessService.extendBusinessTrial,
  deleteBusiness: coreBusinessService.deleteBusiness,
  getBusinessBySlug: coreBusinessService.getBusinessBySlug,
  getAllBusinesses: coreBusinessService.getAllBusinesses,
  getBusinessesForUser: coreBusinessService.getBusinessesForUser,
  canUserAddBusiness: coreBusinessService.canUserAddBusiness,
  getUserPurchasedSlots: coreBusinessService.getUserPurchasedSlots,
  activateAdditionalBusinessSlot: coreBusinessService.activateAdditionalBusinessSlot,
  activateDashboardWithLicenseKey: coreBusinessService.activateDashboardWithLicenseKey,
  cleanOrphanTestBusinesses: coreBusinessService.cleanOrphanTestBusinesses,
  getActiveBusinessSlug: coreBusinessService.getActiveBusinessSlug,
  setActiveBusinessSlug: coreBusinessService.setActiveBusinessSlug,
  updateBusinessAppearance: coreBusinessService.updateBusinessAppearance,
  resetBusinessAppearance: coreBusinessService.resetBusinessAppearance,
  getRemainingLifetimeSlots: coreBusinessService.getRemainingLifetimeSlots,
  getActiveBusiness: coreBusinessService.getActiveBusiness,
  getActiveBusinessId: coreBusinessService.getActiveBusinessId,
};
