import { PortalAuthorizedRole } from "@/types";

export interface AlumniRolePermissions {
  canViewAlumni: boolean;
  canSearchAlumni: boolean;
  canFilterAlumni: boolean;
  canViewAlumniDetails: boolean;
  canViewCrmIntegrationInfo: boolean;
  canViewExtendedContact: boolean;
}

/**
 * Role-based access control (RBAC) for the Integrated Alumni Feature.
 * Keeps Administrator and Registrar permissions explicitly separated:
 * - Administrator: Full read/search/filter/details + external Alumni CRM integration & sync transparency.
 * - Registrar: Read/search/filter/details for academic & graduation verification only.
 */
export function getAlumniPermissions(
  role?: PortalAuthorizedRole | string | null
): AlumniRolePermissions {
  if (role === "Administrator") {
    return {
      canViewAlumni: true,
      canSearchAlumni: true,
      canFilterAlumni: true,
      canViewAlumniDetails: true,
      canViewCrmIntegrationInfo: true,
      canViewExtendedContact: true,
    };
  }

  if (role === "Registrar") {
    return {
      canViewAlumni: true,
      canSearchAlumni: true,
      canFilterAlumni: true,
      canViewAlumniDetails: true,
      canViewCrmIntegrationInfo: false,
      canViewExtendedContact: false,
    };
  }

  return {
    canViewAlumni: false,
    canSearchAlumni: false,
    canFilterAlumni: false,
    canViewAlumniDetails: false,
    canViewCrmIntegrationInfo: false,
    canViewExtendedContact: false,
  };
}

