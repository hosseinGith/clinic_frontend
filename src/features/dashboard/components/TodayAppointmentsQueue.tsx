import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import type { Appointment } from "../../../domain/appointment";
import type { AppointmentStatus } from "../../../domain/appointmentStatus";
import {
  STATUS_META,
  getAvailableTransitionsByRole,
} from "../../../domain/appointmentStatus";
import { usePermissions } from "../../../app/usePermissions";
import {
  getInitials,
  formatTimeFa,
  formatPhoneNumber,
} from "../../../lib/format";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ArrowLeft, MoreVertical, Check } from "lucide-react";
import { useClickOutside } from "../../../lib/useClickOutside";

export interface TodayAppointmentsQueueProps {
  appointments?: Appointment[];
  isLoading?: boolean;
  onUpdateStatus: (id: string, newStatus: AppointmentStatus) => void;
  isUpdating?: boolean;
}

export const TodayAppointmentsQueue: React.FC<TodayAppointmentsQueueProps> =
  React.memo(({ appointments = [], isLoading, onUpdateStatus }) => {
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    useClickOutside(
      menuRef,
      () => setActiveMenuId(null),
      activeMenuId !== null,
    );
    const prevStatusesRef = React.useRef<Record<string, string>>({});
    const [highlightedRowIds, setHighlightedRowIds] = useState<
      Record<string, boolean>
    >({});
    const [pulsingBtnKey, setPulsingBtnKey] = useState<string | null>(null);

    React.useEffect(() => {
      if (appointments.length === 0) return;
      const newHighlights: string[] = [];
      const prev = prevStatusesRef.current;
      const nextStatuses: Record<string, string> = {};

      appointments.forEach((apt) => {
        nextStatuses[apt.id] = apt.status;
        if (prev[apt.id] && prev[apt.id] !== apt.status) {
          newHighlights.push(apt.id);
        }
      });

      prevStatusesRef.current = nextStatuses;

      if (newHighlights.length > 0) {
        setHighlightedRowIds((current) => {
          const updated = { ...current };
          newHighlights.forEach((id) => {
            updated[id] = true;
          });
          return updated;
        });

        const timer = setTimeout(() => {
          setHighlightedRowIds((current) => {
            const updated = { ...current };
            newHighlights.forEach((id) => {
              delete updated[id];
            });
            return updated;
          });
        }, 900);

        return () => clearTimeout(timer);
      }
    }, [appointments]);

    const { can, role } = usePermissions();
    const canUpdateStatus = can("appointments:update_status");

    const handleStatusClick = (
      id: string,
      newStatus: AppointmentStatus,
      btnKey: string,
    ) => {
      setPulsingBtnKey(btnKey);
      setTimeout(() => {
        setPulsingBtnKey((curr) => (curr === btnKey ? null : curr));
      }, 450);
      onUpdateStatus(id, newStatus);
    };

    if (isLoading) {
      return (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              صف نوبتهای امروز
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              وضعیت لحظهای نوبتهای بعدی
            </p>
          </div>

          <Link
            to="/appointments"
            className="flex items-center gap-1 text-xs font-semibold text-[#0f766e] hover:text-[#0b5c55] transition-colors"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-500 text-xs font-medium">
                <th scope="col" className="h-11 px-4 text-right">
                  ساعت
                </th>
                <th scope="col" className="h-11 px-4 text-right">
                  مراجع
                </th>
                <th scope="col" className="h-11 px-4 text-right">
                  خدمت
                </th>
                <th scope="col" className="h-11 px-4 text-right">
                  متخصص
                </th>
                <th scope="col" className="h-11 px-4 text-right">
                  وضعیت
                </th>
                <th scope="col" className="h-11 px-4 text-center">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm text-neutral-900">
              {appointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-xs text-neutral-500"
                  >
                    هیچ نوبتی برای امروز ثبت نشده است.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const meta = STATUS_META[apt.status];
                  const transitions = role
                    ? getAvailableTransitionsByRole(apt.status, role)
                    : [];
                  const isMenuOpen = activeMenuId === apt.id;
                  const isHighlighted = !!highlightedRowIds[apt.id];

                  return (
                    <tr
                      key={apt.id}
                      className={`h-14 hover:bg-neutral-50/60 transition-colors ${
                        isHighlighted ? "mf-row-highlight" : ""
                      }`}
                    >
                      {/* Time */}
                      <td className="px-4 font-semibold text-neutral-900 whitespace-nowrap">
                        {formatTimeFa(apt.time)}
                      </td>

                      {/* Client (Avatar with initial + Name + Phone) */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0f766e] font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(apt.clientName)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 text-xs sm:text-sm">
                              {apt.clientName}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono tracking-wider">
                              {formatPhoneNumber(apt.clientPhone)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-4 text-neutral-700 text-xs sm:text-sm whitespace-nowrap">
                        {apt.serviceName}
                      </td>

                      {/* Doctor */}
                      <td className="px-4 text-neutral-700 text-xs sm:text-sm whitespace-nowrap">
                        {apt.doctorName}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bgClass} ${meta.textClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}
                          />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 whitespace-nowrap text-center relative">
                        <div className="w-full ">
                          {!canUpdateStatus ? (
                            <span className="text-end text-neutral-300 text-xs">—</span>
                          ) : apt.status === "pending_confirmation" ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                handleStatusClick(
                                  apt.id,
                                  "confirmed",
                                  `${apt.id}-confirmed`,
                                )
                              }
                              className={`text-xs  px-2.5 py-1 h-7 ${
                                pulsingBtnKey === `${apt.id}-confirmed`
                                  ? "mf-confirm-pulse"
                                  : ""
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 ml-1" />
                              <span>تأیید</span>
                            </Button>
                            
                          ) : apt.status === "in_clinic" &&
                            (role === "reception" ||
                              role === "owner" ||
                              role === "admin") ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  handleStatusClick(
                                    apt.id,
                                    "completed",
                                    `${apt.id}-completed`,
                                  )
                                }
                                className={`text-xs px-2 py-1 h-7 bg-emerald-600 hover:bg-emerald-700 ${
                                  pulsingBtnKey === `${apt.id}-completed`
                                    ? "mf-confirm-pulse"
                                    : ""
                                }`}
                                title="تکمیل و خروج مراجع"
                              >
                                <Check className="w-3.5 h-3.5 ml-1" />
                                <span>تکمیل</span>
                              </Button>
                              {transitions.length > 0 && (
                                <div
                                  ref={isMenuOpen ? menuRef : undefined}
                                  className="relative inline-block text-right"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveMenuId(
                                        isMenuOpen ? null : apt.id,
                                      )
                                    }
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                                    aria-label="منوی عملیات نوبت"
                                    aria-expanded={isMenuOpen}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                  {isMenuOpen && (
                                    <div
                                      className="absolute left-0 mt-1 w-36 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50 text-xs animate-in fade-in"
                                      onClick={() => setActiveMenuId(null)}
                                    >
                                      {transitions.map((nextStatus) => (
                                        <button
                                          key={nextStatus}
                                          type="button"
                                          onClick={() =>
                                            handleStatusClick(
                                              apt.id,
                                              nextStatus,
                                              `${apt.id}-${nextStatus}`,
                                            )
                                          }
                                          className="w-full text-right px-3 py-1.5 hover:bg-neutral-50 text-neutral-700 flex items-center justify-between"
                                        >
                                          <span>
                                            تغییر به:{" "}
                                            {STATUS_META[nextStatus].label}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : transitions.length > 0 ? (
                            <div
                              ref={isMenuOpen ? menuRef : undefined}
                              className="relative inline-block text-right"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuId(isMenuOpen ? null : apt.id)
                                }
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                                aria-label="منوی عملیات نوبت"
                                aria-expanded={isMenuOpen}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {isMenuOpen && (
                                <div
                                  className="absolute left-0 mt-1 w-36 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 z-50 text-xs animate-in fade-in"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  {transitions.map((nextStatus) => (
                                    <button
                                      key={nextStatus}
                                      type="button"
                                      onClick={() =>
                                        handleStatusClick(
                                          apt.id,
                                          nextStatus,
                                          `${apt.id}-${nextStatus}`,
                                        )
                                      }
                                      className="w-full text-right px-3 py-1.5 hover:bg-neutral-50 text-neutral-700 flex items-center justify-between"
                                    >
                                      <span>
                                        تغییر به:{" "}
                                        {STATUS_META[nextStatus].label}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  });
TodayAppointmentsQueue.displayName = "TodayAppointmentsQueue";
