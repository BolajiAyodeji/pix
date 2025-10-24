import dayjs from 'dayjs';

import { getChallengeLocale } from '../../../../src/shared/infrastructure/utils/request-response-utils.js';
import { getI18nFromRequest } from '../../../shared/infrastructure/i18n/i18n.js';
import { normalizeAndRemoveAccents } from '../../../shared/infrastructure/utils/string-utils.js';
import { Certificate } from '../domain/models/v3/Certificate.js';
import { usecases } from '../domain/usecases/index.js';
import * as certificateSerializer from '../infrastructure/serializers/certificate-serializer.js';
import * as privateCertificateSerializer from '../infrastructure/serializers/private-certificate-serializer.js';
import * as v3CertificationAttestationPdf from '../infrastructure/utils/pdf/generate-pdf-certificate.js';
import * as v2CertificationAttestationPdf from '../infrastructure/utils/pdf/generate-v2-pdf-certificate.js';

const getCertificateByVerificationCode = async function (request, h, dependencies = { certificateSerializer }) {
  const locale = getChallengeLocale(request);
  const i18n = getI18nFromRequest(request);

  let certificate;
  const verificationCode = request.payload.verificationCode;

  const certificationCourse = await usecases.getCertificationCourseByVerificationCode({ verificationCode });

  if (certificationCourse.isV3()) {
    certificate = await usecases.getCertificate({
      certificationCourseId: certificationCourse.getId(),
      locale,
    });
  } else {
    certificate = await usecases.getShareableCertificate({
      certificationCourseId: certificationCourse.getId(),
      locale,
    });
  }
  return dependencies.certificateSerializer.serialize({ certificate, translate: i18n.__ });
};

const getCertificate = async function (
  request,
  h,
  dependencies = { certificateSerializer, privateCertificateSerializer },
) {
  const locale = getChallengeLocale(request);
  const i18n = getI18nFromRequest(request);

  const certificationCourseId = request.params.certificationCourseId;

  const certificationCourseVersion = await usecases.getCertificationCourseVersion({ certificationCourseId });

  let certificate;
  if (certificationCourseVersion.isV3()) {
    certificate = await usecases.getCertificate({
      certificationCourseId,
      locale,
    });
    return dependencies.certificateSerializer.serialize({ certificate, translate: i18n.__ });
  } else {
    certificate = await usecases.getPrivateCertificate({
      certificationCourseId,
      locale,
    });
    return dependencies.privateCertificateSerializer.serialize(certificate, { translate: i18n.__ });
  }
};

const findUserCertificates = async function (request) {
  const i18n = getI18nFromRequest(request);

  const userId = request.auth.credentials.userId;

  const privateCertificates = await usecases.findUserPrivateCertificates({ userId });
  return privateCertificateSerializer.serialize(privateCertificates, { translate: i18n.__ });
};

const getPDFCertificate = async function (
  request,
  h,
  dependencies = { v2CertificationAttestationPdf, v3CertificationAttestationPdf },
) {
  const certificationCourseId = request.params.certificationCourseId;
  const { isFrenchDomainExtension } = request.query;
  const i18n = getI18nFromRequest(request);

  const certificate = await usecases.getCertificate({ certificationCourseId, locale: i18n.getLocale() });

  const fileName = i18n.__('certification.certificate.file-name', {
    deliveredAt: dayjs(certificate.deliveredAt).format('YYYYMMDD'),
  });

  if (certificate instanceof Certificate) {
    return h
      .response(
        dependencies.v3CertificationAttestationPdf.generate({
          certificates: [certificate],
          i18n,
        }),
      )
      .code(200)
      .header('Content-Disposition', `attachment; filename=${fileName}`)
      .header('Content-Type', 'application/pdf');
  }

  return h
    .response(
      dependencies.v2CertificationAttestationPdf.generate({
        certificates: [certificate],
        i18n,
        isFrenchDomainExtension,
      }),
    )
    .code(200)
    .header('Content-Disposition', `attachment; filename=${fileName}`)
    .header('Content-Type', 'application/pdf');
};

const getSessionCertificates = async function (
  request,
  h,
  dependencies = { v2CertificationAttestationPdf, v3CertificationAttestationPdf },
) {
  const i18n = getI18nFromRequest(request);

  const sessionId = request.params.sessionId;
  const isFrenchDomainExtension = request.query.isFrenchDomainExtension;
  const certificates = await usecases.getCertificatesForSession({
    sessionId,
  });

  const translatedFileName = i18n.__('certification.certificate.file-name', {
    deliveredAt: dayjs(certificates[0].deliveredAt).format('YYYYMMDD'),
  });

  if (certificates.every((certificate) => certificate instanceof Certificate)) {
    return h
      .response(
        dependencies.v3CertificationAttestationPdf.generate({
          certificates,
          i18n,
        }),
      )
      .code(200)
      .header('Content-Disposition', `attachment; filename=session-${sessionId}-${translatedFileName}`)
      .header('Content-Type', 'application/pdf');
  }

  return h
    .response(
      dependencies.v2CertificationAttestationPdf.generate({
        certificates,
        i18n,
        isFrenchDomainExtension,
      }),
    )
    .header('Content-Disposition', `attachment; filename=session-${sessionId}-${translatedFileName}`)
    .header('Content-Type', 'application/pdf');
};

const downloadDivisionCertificates = async function (
  request,
  h,
  dependencies = { v2CertificationAttestationPdf, v3CertificationAttestationPdf },
) {
  const i18n = getI18nFromRequest(request);

  const organizationId = request.params.organizationId;
  const { division, isFrenchDomainExtension } = request.query;

  const certificates = await usecases.findCertificatesForDivision({
    organizationId,
    division,
    locale: i18n.getLocale(),
  });

  if (certificates.some((certificate) => certificate instanceof Certificate)) {
    const v3Certificates = certificates.filter((certificate) => certificate instanceof Certificate);
    const normalizedDivision = normalizeAndRemoveAccents(division);

    const translatedFileName = i18n.__('certification.certificate.file-name', {
      deliveredAt: dayjs(certificates[0].deliveredAt).format('YYYYMMDD'),
    });

    return h
      .response(
        dependencies.v3CertificationAttestationPdf.generate({
          certificates: v3Certificates,
          i18n,
        }),
      )
      .code(200)
      .header('Content-Disposition', `attachment; filename=${normalizedDivision}-${translatedFileName}`)
      .header('Content-Type', 'application/pdf');
  }

  const now = dayjs();
  const fileName = `${now.format('YYYYMMDD')}_attestations_${division}.pdf`;

  return h
    .response(
      dependencies.v2CertificationAttestationPdf.generate({
        certificates,
        i18n,
        isFrenchDomainExtension,
      }),
    )
    .header('Content-Disposition', `attachment; filename=${fileName}`)
    .header('Content-Type', 'application/pdf');
};

const certificateController = {
  getCertificate,
  findUserCertificates,
  getCertificateByVerificationCode,
  getPDFCertificate,
  getSessionCertificates,
  downloadDivisionCertificates,
};

export { certificateController };
