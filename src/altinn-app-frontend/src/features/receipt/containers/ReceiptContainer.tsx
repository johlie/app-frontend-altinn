import React, { useEffect, useState } from 'react';

import moment from 'moment';

import {
  useAppDispatch,
  useAppSelector,
  useInstanceIdParams,
} from 'src/common/hooks';
import { selectAppName } from 'src/selectors/language';
import { ReadyForPrint } from 'src/shared/components/ReadyForPrint';
import { InstanceDataActions } from 'src/shared/resources/instanceData/instanceDataSlice';
import { getTextFromAppOrDefault } from 'src/utils/textResource';

import {
  AltinnContentIconReceipt,
  AltinnContentLoader,
  AltinnReceipt,
  AltinnReceiptSimple,
} from 'altinn-shared/components';
import {
  getLanguageFromKey,
  mapInstanceAttachments,
  returnUrlToArchive,
} from 'altinn-shared/utils';
import {
  getAttachmentGroupings,
  getInstancePdf,
} from 'altinn-shared/utils/attachmentsUtils';
import type { IAttachment, IParty } from 'altinn-shared/types';

export const returnInstanceMetaDataObject = (
  orgsData: any,
  languageData: any,
  instanceOwnerParty: any,
  instanceGuid: string,
  userLanguageString: string,
  lastChangedDateTime: string,
  org: any,
) => {
  const obj: any = {};

  obj[getLanguageFromKey('receipt.date_sent', languageData)] =
    lastChangedDateTime;

  let sender = '';
  if (instanceOwnerParty?.ssn) {
    sender = `${instanceOwnerParty.ssn}-${instanceOwnerParty.name}`;
  } else if (instanceOwnerParty?.orgNumber) {
    sender = `${instanceOwnerParty.orgNumber}-${instanceOwnerParty.name}`;
  }
  obj[getLanguageFromKey('receipt.sender', languageData)] = sender;

  if (orgsData[org]) {
    obj[getLanguageFromKey('receipt.receiver', languageData)] =
      orgsData[org].name[userLanguageString];
  } else {
    // This is only related to testing in Altinn Studio Dev
    obj[getLanguageFromKey('receipt.receiver', languageData)] =
      'Error: Receiver org not found';
  }

  obj[getLanguageFromKey('receipt.ref_num', languageData)] =
    instanceGuid.split('-')[4];

  return obj;
};

const ReceiptContainer = () => {
  const dispatch = useAppDispatch();
  const [attachments, setAttachments] = useState([]);
  const [pdf, setPdf] = useState<IAttachment[]>(null);
  const [lastChangedDateTime, setLastChangedDateTime] = useState('');
  const [instanceMetaObject, setInstanceMetaObject] = useState({});
  const [userLanguage, setUserLanguage] = useState('nb');

  const allOrgs = useAppSelector((state) => state.organisationMetaData.allOrgs);
  const applicationMetadata = useAppSelector(
    (state) => state.applicationMetadata.applicationMetadata,
  );
  const instance = useAppSelector((state) => state.instanceData.instance);
  const language = useAppSelector((state) => state.language.language);
  const parties = useAppSelector((state) => state.party.parties);
  const textResources = useAppSelector(
    (state) => state.textResources.resources,
  );
  const profile = useAppSelector((state) => state.profile.profile);
  const appName = useAppSelector(selectAppName);

  const origin = window.location.origin;

  const { instanceGuid, instanceId } = useInstanceIdParams();

  const isLoading = (): boolean =>
    !attachments ||
    !instanceMetaObject ||
    !lastChangedDateTime ||
    !allOrgs ||
    !instance ||
    !parties;

  useEffect(() => {
    dispatch(
      InstanceDataActions.get({
        instanceId,
      }),
    );
  }, [instanceId, dispatch]);

  useEffect(() => {
    if (profile && profile.profileSettingPreference) {
      setUserLanguage(profile.profileSettingPreference.language);
    }
  }, [profile]);

  useEffect(() => {
    if (allOrgs != null && instance && instance.org && allOrgs && parties) {
      const instanceOwnerParty = parties.find((party: IParty) => {
        return party.partyId.toString() === instance.instanceOwner.partyId;
      });

      const obj = returnInstanceMetaDataObject(
        allOrgs,
        language,
        instanceOwnerParty,
        instanceGuid,
        userLanguage,
        lastChangedDateTime,
        instance.org,
      );
      setInstanceMetaObject(obj);
    }
  }, [
    allOrgs,
    parties,
    instance,
    lastChangedDateTime,
    language,
    instanceGuid,
    userLanguage,
  ]);

  useEffect(() => {
    if (instance && instance.data && applicationMetadata) {
      const appLogicDataTypes = applicationMetadata.dataTypes.filter(
        (dataType) => !!dataType.appLogic,
      );

      const attachmentsResult = mapInstanceAttachments(
        instance.data,
        appLogicDataTypes.map((type) => type.id),
      );
      setAttachments(attachmentsResult);
      setPdf(getInstancePdf(instance.data));
      setLastChangedDateTime(
        moment(instance.lastChanged).format('DD.MM.YYYY / HH:mm'),
      );
    }
  }, [instance, applicationMetadata]);

  return (
    <div id='ReceiptContainer'>
      {isLoading() ? (
        <AltinnContentLoader
          width={705}
          height={561}
        >
          <AltinnContentIconReceipt />
        </AltinnContentLoader>
      ) : (
        <>
          {!applicationMetadata.autoDeleteOnProcessEnd && (
            <AltinnReceipt
              attachmentGroupings={getAttachmentGroupings(
                attachments,
                applicationMetadata,
                textResources,
              )}
              body={getLanguageFromKey('receipt.body', language)}
              collapsibleTitle={getLanguageFromKey(
                'receipt.attachments',
                language,
              )}
              instanceMetaDataObject={instanceMetaObject}
              subtitle={getLanguageFromKey('receipt.subtitle', language)}
              subtitleurl={returnUrlToArchive(origin)}
              title={`${appName} ${getLanguageFromKey(
                'receipt.title_part_is_submitted',
                language,
              )}`}
              titleSubmitted={getLanguageFromKey(
                'receipt.title_submitted',
                language,
              )}
              pdf={pdf || null}
            />
          )}
          {applicationMetadata.autoDeleteOnProcessEnd && (
            <AltinnReceiptSimple
              body={getTextFromAppOrDefault(
                'receipt.body_simple',
                textResources,
                language,
                null,
                false,
              )}
              title={`${appName} ${getLanguageFromKey(
                'receipt.title_part_is_submitted',
                language,
              )}`}
            />
          )}
          <ReadyForPrint />
        </>
      )}
    </div>
  );
};

export default ReceiptContainer;
