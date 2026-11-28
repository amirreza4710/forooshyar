import * as React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";

afterEach(cleanup);

it("کاربر با دکمه بستن فارسی پنجره را می‌بندد", () => {
  function Example() {
    const [open, setOpen] = React.useState(true);
    return <Dialog open={open} onOpenChange={setOpen}><DialogContent dir="rtl"><DialogTitle>شروع ویزیت</DialogTitle><DialogDescription>اطلاعات ویزیت</DialogDescription><input aria-label="یادداشت" /></DialogContent></Dialog>;
  }
  render(<Example />);
  expect(screen.getByRole("dialog", { name: "شروع ویزیت" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "بستن" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
