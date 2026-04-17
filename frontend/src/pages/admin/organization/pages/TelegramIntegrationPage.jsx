import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import TelegramSettings from '../components/TelegramSettings';
import { useOrganization } from '../useOrganization';
import { toast } from 'react-toastify';
import swal from 'sweetalert';

const TelegramIntegrationPage = () => {
    const { 
        companyinp, 
        setcompany, 
        handleChange, 
        teleloading, 
        setteleloading, 
        isload, 
        handleSubmit 
    } = useOrganization();

    const fetchgroup = async () => {
        setteleloading(true);
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${companyinp.telegram.token}/getUpdates`
            );
            const data = await response.json();

            if (data.result.length > 0) {
                let groups = {};
                data.result.forEach((m) => {
                    if (m.message?.chat.type === "group") {
                        let groupId = m.message.chat.id;
                        if (!groups.hasOwnProperty(groupId)) {
                            groups[groupId] = {
                                groupId: Math.abs(m.message.chat.id),
                                groupName: m.message.chat.title || "",
                            };
                        }
                    }
                });

                let html = Object.values(groups)
                    .map((g, i) =>
                        `<label style="display:block;margin:5px 0">
                            <input type="radio" name="groupRadio" value="${g.groupId}" ${i === 0 ? "checked" : ""} />
                            ${g.groupName}
                        </label>`
                    )
                    .join("");

                swal({
                    title: "Select a Group",
                    content: {
                        element: "div",
                        attributes: { innerHTML: html },
                    },
                    buttons: {
                        cancel: "Cancel",
                        confirm: { text: "Select", closeModal: true },
                    },
                }).then((willConfirm) => {
                    if (willConfirm) {
                        const selected = document.querySelector("input[name='groupRadio']:checked")?.value;
                        if (selected) {
                            setcompany({
                                ...companyinp,
                                telegram: {
                                    ...companyinp.telegram,
                                    groupId: selected,
                                },
                            });
                        }
                    }
                });
            }
        } catch (error) {
            toast.warn("Error fetching telegram groups");
            console.error('Telegram API error:', error);
        } finally {
            setteleloading(false);
        }
    };

    return (
        <OrganizationLayout title="Telegram Integration">
            <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md p-4'>
                <TelegramSettings
                    companyinp={companyinp}
                    setcompany={setcompany}
                    handleChange={handleChange}
                    fetchgroup={fetchgroup}
                    teleloading={teleloading}
                    isload={isload}
                    handleSubmit={handleSubmit}
                />
            </div>
        </OrganizationLayout>
    );
};

export default TelegramIntegrationPage;
