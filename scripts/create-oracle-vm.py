#!/usr/bin/env python3
"""
Bellor - Oracle Cloud VM Creator (Standalone)
=============================================
Run this script independently to create an ARM A1 VM.
It will retry automatically until capacity is available.

Usage: python scripts/create-oracle-vm.py
       python scripts/create-oracle-vm.py --hours 4

The script saves the IP to ~/.oci/server_ip.txt on success.
After success, run: bash scripts/push-to-server.sh
"""

import oci
import time
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description='Create Oracle ARM A1 VM')
    parser.add_argument('--hours', type=float, default=2,
                        help='Max hours to retry (default: 2)')
    parser.add_argument('--interval', type=int, default=60,
                        help='Seconds between retries (default: 60)')
    args = parser.parse_args()

    config = oci.config.from_file('~/.oci/config', 'DEFAULT')
    tenancy_id = config['tenancy']
    compartment_id = tenancy_id

    infra = {}
    with open("C:/Users/talwa/.oci/infra_ids.txt") as f:
        for line in f:
            k, v = line.strip().split("=", 1)
            infra[k] = v

    with open("C:/Users/talwa/.ssh/oracle_bellor.pub") as f:
        ssh_pub_key = f.read().strip()

    compute = oci.core.ComputeClient(config)

    configs_to_try = [
        (4, 24, "Full Free Tier"),
        (2, 12, "Medium"),
        (1, 6,  "Minimum"),
    ]

    max_attempts = int(args.hours * 3600 / args.interval)
    attempt = 0

    print(f"Will retry for up to {args.hours} hours ({max_attempts} attempts)")
    print(f"Retry interval: {args.interval} seconds")
    print(f"Press Ctrl+C to stop\n")

    while attempt < max_attempts:
        for ocpus, memory, label in configs_to_try:
            attempt += 1
            try:
                ts = time.strftime("%H:%M:%S")
                print(f"[{ts}] #{attempt} Trying {label} ({ocpus} OCPU / {memory} GB)...",
                      end=" ", flush=True)

                instance = compute.launch_instance(
                    oci.core.models.LaunchInstanceDetails(
                        compartment_id=compartment_id,
                        availability_domain="bygq:IL-JERUSALEM-1-AD-1",
                        display_name="bellor-server",
                        shape="VM.Standard.A1.Flex",
                        shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
                            ocpus=ocpus,
                            memory_in_gbs=memory
                        ),
                        source_details=oci.core.models.InstanceSourceViaImageDetails(
                            source_type="image",
                            image_id="ocid1.image.oc1.il-jerusalem-1.aaaaaaaabgg5hxiua7rkp5deqhxydtmcedqtdwblsbwuwgskettzgeiavpfa",
                            boot_volume_size_in_gbs=100
                        ),
                        create_vnic_details=oci.core.models.CreateVnicDetails(
                            subnet_id=infra["subnet_id"],
                            assign_public_ip=True,
                            display_name="bellor-vnic"
                        ),
                        metadata={"ssh_authorized_keys": ssh_pub_key}
                    )
                ).data

                print(f"SUCCESS!")
                print(f"\n  Instance ID: {instance.id}")
                print(f"  Waiting for RUNNING state...")

                for i in range(120):
                    try:
                        inst = compute.get_instance(instance.id).data
                        if inst.lifecycle_state == "RUNNING":
                            break
                        if i % 6 == 0:
                            print(f"  [{i*5}s] {inst.lifecycle_state}")
                    except Exception:
                        pass
                    time.sleep(5)

                time.sleep(5)
                vnet = oci.core.VirtualNetworkClient(config)
                attachments = compute.list_vnic_attachments(
                    compartment_id=compartment_id,
                    instance_id=instance.id
                ).data

                if attachments:
                    vnic = vnet.get_vnic(attachments[0].vnic_id).data
                    ip = vnic.public_ip

                    with open("C:/Users/talwa/.oci/server_ip.txt", "w") as f:
                        f.write(str(ip))

                    with open("C:/Users/talwa/.oci/infra_ids.txt", "a") as f:
                        f.write(f"instance_id={instance.id}\n")
                        f.write(f"public_ip={ip}\n")

                    print(f"\n{'='*50}")
                    print(f"  VM READY!")
                    print(f"  Public IP:  {ip}")
                    print(f"  Config:     {ocpus} OCPU / {memory} GB RAM")
                    print(f"  SSH:        ssh -i ~/.ssh/oracle_bellor ubuntu@{ip}")
                    print(f"{'='*50}")
                    print(f"\nNext step:")
                    print(f"  bash scripts/push-to-server.sh {ip}")

                sys.exit(0)

            except oci.exceptions.ServiceError as e:
                if "Out of host capacity" in str(e.message):
                    print("No capacity")
                elif "TooManyRequests" in str(e.code) or "Too many" in str(e.message):
                    print("Rate limited, waiting extra...")
                    time.sleep(30)
                elif "LimitExceeded" in str(e.code):
                    print("Limit exceeded, skipping config")
                    continue
                else:
                    print(f"Error: {e.message}")
            except KeyboardInterrupt:
                print("\n\nStopped by user.")
                sys.exit(0)
            except Exception:
                print("Connection error")

        time.sleep(args.interval)

    print(f"\nTimed out after {args.hours} hours. Run again later.")
    sys.exit(1)

if __name__ == "__main__":
    main()
